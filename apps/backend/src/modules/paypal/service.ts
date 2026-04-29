import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
} from "@medusajs/framework/utils";
import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  Order,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
  OrderAuthorizeResponse,
  OrderRequest,
  OrdersController,
  OrderStatus,
  PatchOp,
  PaymentsController,
} from "@paypal/paypal-server-sdk";

type Options = {
  client_id: string;
  client_secret: string;
  environment?: "sandbox" | "production";
  autoCapture?: boolean;
  webhook_id?: string;
  api_base_url?: string;
};

type InjectedDependencies = {
  logger: Logger;
};

type PaymentData = Record<string, unknown>;

type PayPalErrorLike = {
  result?: {
    message?: string;
  };
  message?: string;
};

type PayPalOAuthTokenResponse = {
  access_token?: string;
};

type PayPalWebhookVerifyResponse = {
  verification_status?: string;
};

type PayPalAmount = {
  value?: string | number;
};

type PayPalWebhookPayment = {
  amount?: PayPalAmount;
};

type PayPalWebhookResource = {
  custom_id?: string;
  amount?: PayPalAmount;
  purchase_units?: {
    payments?: {
      captures?: PayPalWebhookPayment[];
      authorizations?: PayPalWebhookPayment[];
    };
  }[];
};

type PayPalWebhookEvent = {
  event_type?: string;
  resource?: PayPalWebhookResource;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

const getString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

const getPaymentData = (data: unknown): PaymentData => {
  return isRecord(data) ? data : {};
};

const getErrorMessage = (error: unknown): string => {
  if (isRecord(error)) {
    const result = error.result;

    if (isRecord(result) && typeof result.message === "string") {
      return result.message;
    }

    if (typeof error.message === "string") {
      return error.message;
    }
  }

  return String(error);
};

const getHeaderValue = (
  headers: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = headers[key];

  if (typeof value === "string") {
    return value;
  }

  if (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string")
  ) {
    return value.join(",");
  }

  return undefined;
};

const parseWebhookEvent = (value: unknown): PayPalWebhookEvent => {
  return isRecord(value) ? (value as PayPalWebhookEvent) : {};
};

class PayPalPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "paypal";

  protected logger_: Logger;
  protected options_: Options;
  protected client_: Client;
  protected ordersController_: OrdersController;
  protected paymentsController_: PaymentsController;

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options);

    this.logger_ = container.logger;
    this.options_ = {
      environment: "sandbox",
      autoCapture: false,
      ...options,
    };

    this.client_ = new Client({
      environment:
        this.options_.environment === "production"
          ? Environment.Production
          : Environment.Sandbox,
      clientCredentialsAuthCredentials: {
        oAuthClientId: this.options_.client_id,
        oAuthClientSecret: this.options_.client_secret,
      },
    });
    this.ordersController_ = new OrdersController(this.client_);
    this.paymentsController_ = new PaymentsController(this.client_);
  }

  static validateOptions(options: Record<string, unknown>): void | never {
    if (!options.client_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Client ID is required",
      );
    }

    if (!options.client_secret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Client secret is required",
      );
    }

    if (options.webhook_id && !options.api_base_url) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal API base URL is required when webhook verification is enabled",
      );
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentOutput> {
    try {
      const { amount, currency_code } = input;
      const data = getPaymentData(input.data);
      const intent = this.options_.autoCapture
        ? CheckoutPaymentIntent.Capture
        : CheckoutPaymentIntent.Authorize;

      const orderRequest: OrderRequest = {
        intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency_code.toUpperCase(),
              value: amount.toString(),
            },
            description: "Order payment",
            customId: getString(data.session_id),
          },
        ],
        applicationContext: {
          brandName: "Store",
          landingPage: OrderApplicationContextLandingPage.NoPreference,
          userAction: OrderApplicationContextUserAction.PayNow,
        },
      };

      const response = await this.ordersController_.createOrder({
        body: orderRequest,
        prefer: "return=representation",
      });
      const order = response.result;

      if (!order?.id) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to create PayPal order",
        );
      }

      const approvalUrl = order.links?.find(
        (link) => link.rel === "approve",
      )?.href;

      return {
        id: order.id,
        data: {
          order_id: order.id,
          intent,
          status: order.status,
          approval_url: approvalUrl,
          session_id: data.session_id,
          currency_code,
        },
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to initiate PayPal payment: ${getErrorMessage(error)}`,
      );
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput,
  ): Promise<AuthorizePaymentOutput> {
    try {
      const data = getPaymentData(input.data);
      const orderId = getString(data.order_id);

      if (!orderId || typeof orderId !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal order ID is required",
        );
      }

      if (this.options_.autoCapture) {
        const response = await this.ordersController_.captureOrder({
          id: orderId,
          prefer: "return=representation",
        });
        const capture = response.result;

        if (!capture?.id) {
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            "Failed to capture PayPal payment",
          );
        }

        const captureId =
          capture.purchaseUnits?.[0]?.payments?.captures?.[0]?.id;

        return {
          data: {
            ...data,
            capture_id: captureId,
            intent: "CAPTURE",
          },
          status: "captured" as PaymentSessionStatus,
        };
      }

      const response = await this.ordersController_.authorizeOrder({
        id: orderId,
        prefer: "return=representation",
      });
      const authorization = response.result;

      if (!authorization?.id) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to authorize PayPal payment",
        );
      }

      const authId =
        authorization.purchaseUnits?.[0]?.payments?.authorizations?.[0]?.id;

      return {
        data: {
          order_id: orderId,
          authorization_id: authId,
          intent: "AUTHORIZE",
          currency_code: data.currency_code,
        },
        status: "authorized" as PaymentSessionStatus,
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to authorize PayPal payment: ${getErrorMessage(error)}`,
      );
    }
  }

  async capturePayment(
    input: CapturePaymentInput,
  ): Promise<CapturePaymentOutput> {
    try {
      const data = getPaymentData(input.data);
      const authorizationId = getString(data.authorization_id);

      if (!authorizationId || typeof authorizationId !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal authorization ID is required for capture",
        );
      }

      const response = await this.paymentsController_.captureAuthorizedPayment({
        authorizationId,
        prefer: "return=representation",
      });
      const capture = response.result;

      if (!capture?.id) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to capture PayPal payment",
        );
      }

      return {
        data: {
          ...data,
          capture_id: capture.id,
        },
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to capture PayPal payment: ${getErrorMessage(error)}`,
      );
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      const data = getPaymentData(input.data);
      const captureId = getString(data.capture_id);

      if (!captureId || typeof captureId !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal capture ID is required for refund",
        );
      }

      const refundRequest = {
        amount: {
          currencyCode: getString(data.currency_code)?.toUpperCase() || "",
          value: new BigNumber(input.amount).numeric.toString(),
        },
      };

      const response = await this.paymentsController_.refundCapturedPayment({
        captureId,
        body: refundRequest,
        prefer: "return=representation",
      });
      const refund = response.result;

      if (!refund?.id) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to refund PayPal payment",
        );
      }

      return {
        data: {
          ...data,
          refund_id: refund.id,
        },
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to refund PayPal payment: ${getErrorMessage(error)}`,
      );
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    try {
      const data = getPaymentData(input.data);
      const orderId = getString(data.order_id);

      if (!orderId || typeof orderId !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal order ID is required",
        );
      }

      await this.ordersController_.patchOrder({
        id: orderId,
        body: [
          {
            op: PatchOp.Replace,
            path: "/purchase_units/@reference_id=='default'/amount",
            value: {
              currencyCode: input.currency_code.toUpperCase(),
              value: input.amount.toString(),
            },
          },
        ],
      });

      return {
        data: {
          ...data,
          currency_code: input.currency_code,
        },
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to update PayPal payment: ${getErrorMessage(error)}`,
      );
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return {
      data: input.data,
    };
  }

  async retrievePayment(
    input: RetrievePaymentInput,
  ): Promise<RetrievePaymentOutput> {
    try {
      const data = getPaymentData(input.data);
      const orderId = getString(data.order_id);

      if (!orderId || typeof orderId !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal order ID is required",
        );
      }

      const response = await this.ordersController_.getOrder({
        id: orderId,
      });
      const order = response.result;

      return {
        data: {
          ...data,
          order,
          status: order?.status,
        },
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to retrieve PayPal payment: ${getErrorMessage(error)}`,
      );
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const data = getPaymentData(input.data);
      const authorizationId = getString(data.authorization_id);

      if (!authorizationId || typeof authorizationId !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal authorization ID is required for cancellation",
        );
      }

      await this.paymentsController_.voidPayment({
        authorizationId,
      });

      return {
        data: input.data,
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to cancel PayPal payment: ${getErrorMessage(error)}`,
      );
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<GetPaymentStatusOutput> {
    try {
      const data = getPaymentData(input.data);
      const orderId = getString(data.order_id);

      if (!orderId || typeof orderId !== "string") {
        return { status: "pending" as PaymentSessionStatus };
      }

      const response = await this.ordersController_.getOrder({
        id: orderId,
      });
      const order = response.result;

      if (!order) {
        return { status: "pending" as PaymentSessionStatus };
      }

      switch (order.status) {
        case OrderStatus.Created:
        case OrderStatus.Saved:
          return { status: "pending" as PaymentSessionStatus };
        case OrderStatus.Approved:
        case OrderStatus.Completed:
          return { status: "authorized" as PaymentSessionStatus };
        case OrderStatus.Voided:
          return { status: "canceled" as PaymentSessionStatus };
        default:
          return { status: "pending" as PaymentSessionStatus };
      }
    } catch {
      return { status: "pending" as PaymentSessionStatus };
    }
  }

  private async verifyWebhookSignature(
    headers: Record<string, unknown>,
    body: unknown,
    rawBody: string | Buffer | undefined,
  ): Promise<boolean> {
    try {
      if (!this.options_.webhook_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal webhook ID is required for webhook signature verification",
        );
      }

      const transmissionId = getHeaderValue(headers, "paypal-transmission-id");
      const transmissionTime = getHeaderValue(
        headers,
        "paypal-transmission-time",
      );
      const certUrl = getHeaderValue(headers, "paypal-cert-url");
      const authAlgo = getHeaderValue(headers, "paypal-auth-algo");
      const transmissionSig = getHeaderValue(
        headers,
        "paypal-transmission-sig",
      );

      if (
        !transmissionId ||
        !transmissionTime ||
        !certUrl ||
        !authAlgo ||
        !transmissionSig
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing required PayPal webhook headers",
        );
      }

      const baseUrl = this.options_.api_base_url?.replace(/\/+$/, "");

      if (!baseUrl) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal API base URL is required for webhook verification",
        );
      }

      const verifyUrl = `${baseUrl}/v1/notifications/verify-webhook-signature`;

      const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${this.options_.client_id}:${this.options_.client_secret}`,
          ).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!authResponse.ok) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to get access token for webhook verification",
        );
      }

      const authData = (await authResponse.json()) as PayPalOAuthTokenResponse;
      const accessToken = authData.access_token;

      if (!accessToken) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Access token not received from PayPal",
        );
      }

      let webhookEvent: unknown;

      if (rawBody) {
        const rawBodyString =
          typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

        try {
          webhookEvent = JSON.parse(rawBodyString);
        } catch {
          this.logger_.warn("Raw body is not valid JSON, using parsed body");
          webhookEvent = body;
        }
      } else {
        this.logger_.warn(
          "Raw body not available, using parsed body. Verification may fail if formatting differs.",
        );
        webhookEvent = body;
      }

      const verifyPayload = {
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: this.options_.webhook_id,
        webhook_event: webhookEvent,
      };

      const verifyResponse = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(verifyPayload),
      });

      if (!verifyResponse.ok) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Webhook verification API call failed",
        );
      }

      const verifyData =
        (await verifyResponse.json()) as PayPalWebhookVerifyResponse;
      const isValid = verifyData.verification_status === "SUCCESS";

      if (!isValid) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Webhook signature verification failed",
        );
      }

      return isValid;
    } catch (e) {
      this.logger_.error("PayPal verifyWebhookSignature error:", e);
      return false;
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    try {
      const { data, rawData, headers } = payload;
      const isValid = await this.verifyWebhookSignature(
        headers || {},
        data,
        rawData || "",
      );

      if (!isValid) {
        this.logger_.error("Invalid PayPal webhook signature");
        return {
          action: PaymentActions.FAILED,
          data: {
            session_id: "",
            amount: new BigNumber(0),
          },
        };
      }

      const event = parseWebhookEvent(data);
      const eventType = event.event_type;

      if (!eventType) {
        this.logger_.warn("PayPal webhook event missing event_type");
        return {
          action: PaymentActions.NOT_SUPPORTED,
          data: {
            session_id: "",
            amount: new BigNumber(0),
          },
        };
      }

      const resource = event.resource;
      const sessionId = resource?.custom_id;

      if (!sessionId) {
        this.logger_.warn("Session ID not found in PayPal webhook resource");
        return {
          action: PaymentActions.NOT_SUPPORTED,
          data: {
            session_id: "",
            amount: new BigNumber(0),
          },
        };
      }

      const amountValue =
        resource?.amount?.value ||
        resource?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ||
        resource?.purchase_units?.[0]?.payments?.authorizations?.[0]?.amount
          ?.value ||
        0;
      const payloadData = {
        session_id: sessionId,
        amount: new BigNumber(amountValue),
      };

      switch (eventType) {
        case "PAYMENT.AUTHORIZATION.CREATED":
          return {
            action: PaymentActions.AUTHORIZED,
            data: payloadData,
          };
        case "PAYMENT.CAPTURE.DENIED":
          return {
            action: PaymentActions.FAILED,
            data: payloadData,
          };
        case "PAYMENT.AUTHORIZATION.VOIDED":
          return {
            action: PaymentActions.CANCELED,
            data: payloadData,
          };
        case "PAYMENT.CAPTURE.COMPLETED":
          return {
            action: PaymentActions.SUCCESSFUL,
            data: payloadData,
          };
        default:
          this.logger_.info(`Unhandled PayPal webhook event: ${eventType}`);
          return {
            action: PaymentActions.NOT_SUPPORTED,
            data: payloadData,
          };
      }
    } catch (error: unknown) {
      this.logger_.error(
        `PayPal getWebhookActionAndData error: ${getErrorMessage(error)}`,
      );

      return {
        action: PaymentActions.FAILED,
        data: {
          session_id: "",
          amount: new BigNumber(0),
        },
      };
    }
  }
}

export default PayPalPaymentProviderService;
