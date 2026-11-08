/* The owner dashboard's chrome, shared by every page of the v2 prototype: the sidebar and the top
   bar, drawn with the design system (window.DentalBase). Each page passes the nav item it is. */
(function () {
  var D = window.DentalBase;
  if (!D) return;
  var html = D.html;
  var useState = D.React.useState;

  // ?quick carries from page to page, so a reviewer who skipped the intro keeps skipping it.
  var keep = /[?&]quick(=|&|$)/.test(location.search) ? "?quick" : "";

  var nav = [
    { id: "home", label: "Home", icon: "house", href: "index.html" + keep },
    { id: "schedule", label: "Schedule", icon: "calendar", href: "schedule.html" + keep },
    { id: "patients", label: "Patients", icon: "users", href: "#" },
  ];
  var products = [
    { id: "dentivoice", label: "DentiVoice", icon: "phone", href: "#" },
    { id: "dentireach", label: "DentiReach", icon: "arrow-up-right", href: "#" },
    { id: "dentigrowth", label: "DentiGrowth", icon: "trending-up", href: "#" },
    { id: "dentivoip", label: "DentiVoIP", icon: "message-square", href: "#" },
    { id: "dentimetrics", label: "DentiMetrics", icon: "chart-column", href: "#" },
  ];

  function Sidebar(props) {
    var s = useState(false),
      collapsed = s[0],
      setCollapsed = s[1];
    var item = function (n) {
      return html`<${D.NavItem}
        key=${n.id}
        href=${n.href}
        icon=${n.icon}
        label=${n.label}
        active=${n.id === props.active}
        collapsed=${collapsed}
      />`;
    };
    // Collapsed, the Logo is the mark alone, so an expand button sits above it (as the prototype drew it).
    return html`<nav
      className=${"sidebar" + (collapsed ? " is-collapsed" : "")}
      aria-label="Main"
      style=${{ overflowX: "hidden" }}
    >
      ${
        collapsed
          ? html`<div className="flex flex-col items-center gap-xs">
              <${D.IconButton}
                icon="chevrons-right"
                label="Expand sidebar"
                variant="ghost"
                size="sm"
                onClick=${function () {
                  setCollapsed(false);
                }}
              />
              <${D.Logo} href=${nav[0].href} variant="mark" />
            </div>`
          : html`<${D.Logo}
              href=${nav[0].href}
              collapsible
              onToggle=${function () {
                setCollapsed(true);
              }}
            />`
      }
      <div className="spacer-sm"></div>
      ${nav.map(item)}
      ${collapsed ? null : html`<${D.NavGroupLabel} label="Products" chevron=${false} />`}
      ${products.map(item)}
      <div className="spacer"></div>
      ${item({ id: "settings", label: "Settings", icon: "settings", href: "#" })}
    </nav>`;
  }

  function TopBar() {
    return html`<header className="topbar">
      <div style=${{ flex: "1 0 0", minWidth: 0 }}>
        <${D.PracticeSwitcher}
          name="Bright Smile Dental"
          location="Austin, TX"
          logoSrc="assets/practice-logo.svg"
        />
      </div>
      <${D.IconButton} icon="search" label="Search" variant="ghost" />
      <${D.IconButton} icon="bell" label="Notifications" variant="ghost" />
      <${D.Avatar} src="assets/dr-smith.jpg" initials="DS" aria-label="Account: Dr. Smith" />
    </header>`;
  }

  window.OwnerShell = { Sidebar: Sidebar, TopBar: TopBar, href: { schedule: nav[1].href } };
})();
