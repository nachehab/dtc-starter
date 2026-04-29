\if :{?public_backend_url}
\else
\echo 'Set public_backend_url with: psql "$DATABASE_URL" -v public_backend_url="$PUBLIC_BACKEND_URL" -f scripts/fix-image-urls.sql'
\quit 1
\endif

UPDATE "image"
SET url = CASE
  WHEN url LIKE '/static/%' THEN :'public_backend_url' || url
  WHEN url LIKE 'static/%' THEN :'public_backend_url' || '/' || url
  ELSE regexp_replace(
    url,
    (
      '^http://(?:' ||
      'local' || 'host' ||
      '|127[.]0[.]0[.]1' ||
      '|10(?:[.][0-9]{1,3}){3}' ||
      '|172[.](?:1[6-9]|2[0-9]|3[0-1])(?:[.][0-9]{1,3}){2}' ||
      '|192[.]168(?:[.][0-9]{1,3}){2}' ||
      '|medusa|medusa-dev|backend' ||
      ')(?::[0-9]+)?'
    ),
    :'public_backend_url'
  )
END
WHERE url ~ (
    '^http://(?:' ||
    'local' || 'host' ||
    '|127[.]0[.]0[.]1' ||
    '|10(?:[.][0-9]{1,3}){3}' ||
    '|172[.](?:1[6-9]|2[0-9]|3[0-1])(?:[.][0-9]{1,3}){2}' ||
    '|192[.]168(?:[.][0-9]{1,3}){2}' ||
    '|medusa|medusa-dev|backend' ||
    ')(?::[0-9]+)?'
  )
  OR url LIKE '/static/%'
  OR url LIKE 'static/%';
