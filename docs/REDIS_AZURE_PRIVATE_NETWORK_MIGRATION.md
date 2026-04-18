# Redis Azure Private Network Migration

This runbook migrates the current Azure Container Instance Redis deployment from public IP to private-only networking.

## Why This Migration

Current setup is protected by password auth, but endpoint exposure remains public. Private networking reduces attack surface and aligns with production security expectations.

## Preconditions

1. Backend runtime is hosted in Azure and can access a VNet/subnet.
2. You can modify backend hosting networking (for example Azure App Service VNet integration).
3. You can briefly rotate Redis endpoint and restart backend.

## Current State Reference

1. Resource group: `preploop-redis-rg`
2. Container group: `preploop-redis-aci`
3. Current env setting in [backend/.env](backend/.env)

## Step 1: Create VNet and Delegated Subnet

```powershell
az network vnet create \
  --resource-group preploop-redis-rg \
  --name preploop-redis-vnet \
  --address-prefix 10.50.0.0/16 \
  --subnet-name redis-subnet \
  --subnet-prefix 10.50.1.0/24

az network vnet subnet update \
  --resource-group preploop-redis-rg \
  --vnet-name preploop-redis-vnet \
  --name redis-subnet \
  --delegations Microsoft.ContainerInstance/containerGroups
```

## Step 2: Recreate Redis ACI as Private-Only

Note:
1. Do not set `--ip-address Public`
2. Attach to delegated subnet with `--subnet`

```powershell
$redisPassword = '<rotate-to-new-strong-password>'

az container delete \
  --resource-group preploop-redis-rg \
  --name preploop-redis-aci \
  --yes

az container create \
  --resource-group preploop-redis-rg \
  --name preploop-redis-aci \
  --os-type Linux \
  --image redis:7-alpine \
  --cpu 0.5 \
  --memory 1.5 \
  --ports 6379 \
  --subnet "/subscriptions/cfaebe57-780a-44dd-a461-4004dae4ac21/resourceGroups/preploop-redis-rg/providers/Microsoft.Network/virtualNetworks/preploop-redis-vnet/subnets/redis-subnet" \
  --command-line "redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru --requirepass $redisPassword" \
  --output json
```

## Step 3: Fetch Private IP

```powershell
az container show \
  --resource-group preploop-redis-rg \
  --name preploop-redis-aci \
  --query "ipAddress.ip" \
  --output tsv
```

Use output as `<private-ip>`.

## Step 4: Update Backend Redis URL

Update `REDIS_URL` where backend actually runs (local file + hosted environment variables):

```dotenv
USE_REDIS=true
REDIS_URL=redis://:<password>@<private-ip>:6379
```

For local development outside Azure VNet, private IP will not be reachable.

## Step 5: Integrate Backend Host with VNet

If backend is Azure App Service:
1. Enable VNet integration on backend app.
2. Choose a subnet in same VNet or peered VNet with route access to `redis-subnet`.
3. Restart backend app.

## Step 6: Validate

1. Run guardrails in normal mode:

```powershell
npm run redis:guardrails
```

2. Run guardrails in strict mode:

```powershell
npm run redis:guardrails:strict
```

Strict mode should pass only when endpoint is no longer public.

## Rollback Plan

If backend cannot connect after migration:

1. Recreate Redis container with public endpoint and known password.
2. Restore previous `REDIS_URL`.
3. Restart backend.
4. Re-test with [scripts/redis-azure-guardrails.mjs](scripts/redis-azure-guardrails.mjs).

## Recommended Follow-up

1. Move Redis password into Azure Key Vault.
2. Remove plaintext password from local env file after confirming deployed secret source.
3. Add periodic credential rotation and post-rotation verification using guardrails.
