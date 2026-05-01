# Azure Production Monitoring (Option A)

This runbook provisions a production-ready observability baseline using:

- Azure Managed Grafana
- Azure Monitor Workspace
- Log Analytics Workspace
- Application Insights (workspace-based)
- App Service diagnostic settings
- App Service HTTP 5xx metric alert

## What This Gives You

- Managed Grafana with Azure Monitor integration
- Centralized logs and metrics for backend App Service
- Application telemetry ingestion path via Application Insights
- First-line production alerting on backend 5xx spikes

## Prerequisites

- Azure CLI (`az`) installed and authenticated
- Bicep support available in Azure CLI
- Access to deploy to subscription and resource group in `azure.yaml`

## Infrastructure Files

- `infra/main.bicep` (entrypoint)
- `infra/appService.bicep` (existing app service resources)
- `infra/monitoring.bicep` (new monitoring resources)

## Deploy With azd (Recommended)

Set alert email (optional, but recommended):

```bash
azd env set ALERT_EMAIL "ops@example.com"
```

Preview deployment:

```bash
azd provision --preview
```

Apply deployment:

```bash
azd provision
```

## Deploy With Azure CLI + Bicep

```bash
az account show
az deployment sub create \
  --location centralindia \
  --template-file infra/main.bicep \
  --parameters resourceGroupName=preploop-backend webAppName=preploop-api-staging alertEmail=ops@example.com
```

## Post-Deploy Checklist

1. Confirm resources exist:
   - Managed Grafana
   - Log Analytics Workspace
   - Azure Monitor Workspace
   - Application Insights
2. Open Grafana URL from deployment outputs.
3. Validate App Service diagnostic logs are flowing into Log Analytics.
4. Validate metric alert is enabled and action group is attached (if email configured).
5. Add Grafana dashboards for:
   - App Service latency and 5xx
   - Process/memory signals
   - Dependency failure rates

## Recommended Hardening

- Disable public access on Grafana and use private endpoint.
- Use Azure AD groups for Grafana role mapping.
- Move secret-bearing settings to Key Vault references.
- Increase Log Analytics retention from 30 to 90+ days for production.
- Add additional alerts: CPU, memory working set, restart count, availability.

## Prometheus Note

Managed Prometheus in Azure Monitor is typically used with AKS workloads. For current App Service hosting, this setup provides production-grade observability through Azure Monitor + Application Insights + Managed Grafana.
