# Wi-Fi Troubleshooting (Windows & macOS)
**Symptoms:** disconnects, "No Internet", slow speeds
**Checklist:**
1) Toggle Wi-Fi off/on; try another SSID if available.
2) Forget network and re-add credentials.
3) Check date/time auto-sync (TLS failures).
4) Flush DNS / renew DHCP:
   - Windows (admin): ipconfig /flushdns && ipconfig /release && ipconfig /renew
   - macOS: sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
5) Drivers/OS updates; reboot.
6) Try Ethernet or hotspot to isolate AP issues.
**Escalate if:** multiple users affected, AP down, or corporate SSID auth failing.
