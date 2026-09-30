# JiffyKart Controlled Bug Simulation

## Safety gates
A simulation can run only when ALL are true:
1. `SIMULATION_ENVIRONMENT=true`
2. `JIFFYKART_BUG_SIMULATION_ENABLED=true`
3. India date (`Asia/Kolkata`) is 2026-10-10 or later
4. The individual `JIFFYKART_BUG_XX=true`
5. The request explicitly contains `X-JK-Simulation: true`

The extra request header is a safety boundary so ordinary users are not selected accidentally.

## Emergency rollback
Set `JIFFYKART_BUG_SIMULATION_ENABLED=false` and refresh/restart configuration as required by the deployment platform. This globally disables all simulations.

## Example staging test
Set `SIMULATION_ENVIRONMENT=true`, `JIFFYKART_BUG_SIMULATION_ENABLED=true`, and one bug flag. Send only designated QA traffic with `X-JK-Simulation: true`.

## Important
Never enable `SIMULATION_ENVIRONMENT` in production. No simulation deletes or mutates production data. Failure scenarios return controlled responses, add bounded delays, or mark a request for fallback behavior.
