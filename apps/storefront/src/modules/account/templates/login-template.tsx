"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="content-container py-12">
      <div className="grid gap-6 small:grid-cols-[1fr_420px]">
        <div className="rp-card grid content-center gap-5 p-8">
          <span className="rp-pill w-fit">Rider account</span>
          <h1 className="rp-heading text-5xl font-bold uppercase leading-none text-white">
            Built for riders who live full throttle
          </h1>
          <p className="max-w-xl leading-7 text-[#b7c0b3]">
            Track orders, save addresses, and keep your premium ebike gear
            checkout ready.
          </p>
        </div>
        <div className="rp-card flex justify-center p-8">
          {currentView === "sign-in" ? (
            <Login setCurrentView={setCurrentView} />
          ) : (
            <Register setCurrentView={setCurrentView} />
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
