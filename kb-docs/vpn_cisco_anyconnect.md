# VPN — Cisco AnyConnect
**Common Errors:** login failed, cert expired, cannot reach VPN
**Fixes:**
1) Verify password/MFA; if locked → reset password.
2) Switch transport: Preferences → enable TCP if UDP fails.
3) Check system clock/cert store; renew cert if expired.
4) Reinstall profile; remove stale old profiles.
5) Check split-tunnel rules; test another network.
**Escalate if:** concentrator unreachable or account disabled.
