# Vercel Configuration Notes

## API Rewrite URL
The `vercel.json` currently points `/api/*` to the **staging** backend:
`https://preploop-api-staging.azurewebsites.net`

For production deployments, update this to the production backend URL
or use Vercel's environment-based rewrites.
