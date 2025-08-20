export const KNOWLEDGE = [
  { id:"kb1", title:"Configure Outlook for Office 365", category:"email",
    content:"Open Outlook > Add Account > enter your UPN > modern auth. Check autodiscover and make sure IMAP/POP disabled if using MAPI."},
  { id:"kb2", title:"Common SMTP/IMAP Ports", category:"email",
    content:"SMTP 587 (TLS), IMAP 993 (SSL). Verify auth method and app passwords if legacy clients."},
  { id:"kb3", title:"VPN — IKEv2 Drops", category:"vpn",
    content:"Check dead peer detection and MOBIKE. Ensure port 500/4500 open; disable aggressive mode."},
  { id:"kb4", title:"Reset VPN Profile (macOS)", category:"vpn",
    content:"System Settings > VPN > remove profile > re-import .mobileconfig from portal."},
  { id:"kb5", title:"Laptop Overheating", category:"hardware",
    content:"Clean vents, update BIOS, set balanced power plan, repaste if temps exceed 95°C sustained."},
  { id:"kb6", title:"Dock Not Detecting Monitors", category:"hardware",
    content:"Update dock firmware, try different USB-C port, check DP 1.4 vs 1.2 compatibility."},
  { id:"kb7", title:"Teams Sign-in Loop", category:"email",
    content:"Clear Keychain/Windows Credential Manager, reset Teams cache (%appdata%/Microsoft/Teams)." },
  { id:"kb8", title:"VPN Split Tunneling", category:"vpn",
    content:"Enable split routes only for corporate subnets to keep internet local; verify DNS suffix search list."},
  { id:"kb9", title:"Mailbox Full", category:"email",
    content:"Enable archiving, increase quota if policy allows, use retention tags on big folders."},
  { id:"kb10", title:"SSD Health Check", category:"hardware",
    content:"Use smartctl or vendor tool; if reallocated sectors grow, plan replacement."}
];

export function searchKnowledge(q, cat="all"){
  const qn = (q||"").toLowerCase().trim();
  return KNOWLEDGE.filter(it => (cat==="all"||it.category===cat) &&
    (qn==="" || it.title.toLowerCase().includes(qn) || it.content.toLowerCase().includes(qn)));
}
