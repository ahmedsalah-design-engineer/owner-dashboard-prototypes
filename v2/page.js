/* Home · Owner dashboard v2, drawn entirely with the design system's components.
   vendor/dentalbase-ui.js is the @dentalbase/ui preview bundle (packages/ui build:preview): every
   component on window.DentalBase, with React inside it. styles.css now supplies only the page layout
   (.app, .sidebar, .main, .row, the column widths); every visible piece is a component. */
(function () {
  var D = window.DentalBase;
  var mount = document.getElementById("app");
  if (!D || !mount) return;
  var html = D.html;
  var useState = D.React.useState;
  var useEffect = D.React.useEffect;

  /* ---------- Motion: v2's intro, from the design system ----------
     The full intro plays on every load: this is a prototype people open to review the motion.
     ?quick in the address skips it (figures already in place). HOLD lets the briefing card lead: the
     cards below wait for it. Reveal, animate and attention all stop under reduced motion. */
  var intro = !/[?&]quick(=|&|$)/.test(location.search);
  var animate = intro;
  var HOLD = intro ? 1300 : 0;

  /* ---------- Data (the prototype's example figures) ---------- */
  var wins = [
    {
      id: "plans",
      icon: "file-text",
      tone: "error",
      title: "4 plans to follow up",
      sub: "~$9,200",
      action: "Follow up",
      primary: true,
    },
    {
      id: "visits",
      icon: "calendar",
      tone: "warning",
      title: "3 unconfirmed visits",
      sub: "Tomorrow",
      action: "Confirm",
    },
    {
      id: "review",
      icon: "star",
      tone: "brand",
      title: "New 2★ review",
      sub: "Needs a reply",
      action: "Reply",
    },
  ];
  var visits = [
    {
      time: "9:00",
      name: "Sarah Johnson",
      detail: "Cleaning · Dr. Smith",
      initials: "SJ",
      status: "Confirmed",
      color: "success",
    },
    {
      time: "9:30",
      name: "Omar Haddad",
      detail: "Crown fitting · Dr. Smith",
      initials: "OH",
      status: "Confirmed",
      color: "success",
    },
    {
      time: "10:30",
      name: "Lina Chen",
      detail: "New patient exam",
      initials: "LC",
      status: "Waiting to confirm",
      color: "warning",
    },
    {
      time: "11:30",
      name: "Marcus Lee",
      detail: "Filling · Dr. Smith",
      initials: "ML",
      status: "Confirmed",
      color: "success",
    },
  ];
  var productCards = [
    {
      icon: "phone",
      tone: "primary",
      name: "DentiVoice",
      descriptor: "AI receptionist",
      value: "96",
      unit: "visits booked",
    },
    {
      icon: "arrow-up-right",
      tone: "secondary",
      name: "DentiReach",
      descriptor: "Brings patients back",
      value: "$12.6k",
      unit: "recovered",
    },
    {
      icon: "trending-up",
      tone: "teal",
      name: "DentiGrowth",
      descriptor: "Marketing",
      value: "22",
      unit: "new patients",
    },
    {
      icon: "message-square",
      tone: "violet",
      name: "DentiVoIP",
      descriptor: "Phones and texts",
      value: "318",
      unit: "texts sent",
    },
    {
      icon: "chart-column",
      tone: "success",
      name: "DentiMetrics",
      descriptor: "Team coaching",
      value: "82",
      unit: "team score",
    },
  ];

  /* ---------- Sidebar and top bar: shell.js, shared with the other pages ---------- */
  var Sidebar = window.OwnerShell.Sidebar;
  var TopBar = window.OwnerShell.TopBar;

  /* ---------- Quick wins ---------- */
  function QuickWins() {
    // done: ticked (tick + strike-through); leaving: folding away a beat later; gone: removed.
    var s = useState({}),
      done = s[0],
      setDone = s[1];
    var l = useState({}),
      leaving = l[0],
      setLeaving = l[1];
    var g = useState({}),
      gone = g[0],
      setGone = g[1];
    var left = wins.filter(function (w) {
      return !done[w.id];
    }).length;
    var mark = function (setter, id) {
      setter(function (prev) {
        var n = Object.assign({}, prev);
        n[id] = true;
        return n;
      });
    };
    var toggle = function (id) {
      return function () {
        if (done[id]) return;
        mark(setDone, id);
        setTimeout(function () {
          mark(setLeaving, id);
        }, 750); // let the tick read before it leaves
        setTimeout(function () {
          mark(setGone, id);
        }, 1400); // after the fold (--duration-slow)
      };
    };
    var reset = function () {
      setDone({});
      setLeaving({});
      setGone({});
    };
    var allGone = wins.every(function (w) {
      return gone[w.id];
    });
    return html`<${D.Card}
      className="side-448"
      title="Today’s quick wins"
      subtitle=${left ? left + " left today" : "All done for today"}
      action=${left ? html`<${D.Badge} color="brand" variant="solid">${left}<//>` : null}
      gap="sm"
    >
      <${D.ProgressBar}
        segments=${wins.length}
        filled=${wins.length - left}
        label="Quick wins done"
      />
      ${
        !allGone
          ? html`<${D.Reveal}
              as="ul"
              cascade
              delay=${intro ? 600 : 0}
              className="m-none p-none flex flex-col"
            >
              ${wins.map(function (w) {
                return gone[w.id]
                  ? null
                  : html`<${D.QuickWinItem}
                      key=${w.id}
                      icon=${w.icon}
                      tone=${w.tone}
                      title=${w.title}
                      sub=${w.sub}
                      done=${!!done[w.id]}
                      leaving=${!!leaving[w.id]}
                      onToggle=${toggle(w.id)}
                      action=${html`<${D.Button} size="sm" variant=${w.primary ? "primary" : "neutral"}>${w.action}<//>`}
                    />`;
              })}
            <//>`
          : html`<${D.QuickWinEmpty}
              title="You’re all caught up"
              text="New wins show up here as they come in."
              resetLabel="Show them again"
              onReset=${reset}
            />`
      }
    <//>`;
  }

  /* ---------- Schedule ---------- */
  function Schedule() {
    return html`<${D.Card}
      className="h-full"
      title="Today’s schedule"
      subtitle="18 visits · 3 chairs · 87% of chair time booked"
      action=${html`<${D.Button} variant="neutral" size="sm" asChild
        ><a href=${window.OwnerShell.href.schedule}>Open schedule</a><//
      >`}
    >
      <${D.StackedBar}
        animate=${animate}
        spotlight
        label="Today’s 20 slots: 15 confirmed, 3 waiting to confirm, 2 open worth about $1,200"
        segments=${[
          { label: "Confirmed", value: 15, series: 5 },
          { label: "Waiting to confirm", value: 3, series: 6 },
          { label: "Open slots · ~$1,200", value: 2, series: 1 },
        ]}
      />
      <${D.Reveal} as="ul" cascade delay=${150} className="m-none p-none flex flex-col">
        ${visits.map(function (v) {
          return html`<${D.VisitRow}
            key=${v.time}
            time=${v.time}
            name=${v.name}
            detail=${v.detail}
            initials=${v.initials}
            status=${html`<${D.Badge} color=${v.color}>${v.status}<//>`}
          />`;
        })}
        <${D.VisitRow}
          time="12:00"
          name="Open slot"
          detail="About $600 if filled"
          open
          action=${html`<${D.Button} size="sm" attention>Fill slot<//>`}
        />
      <//>
    <//>`;
  }

  /* ---------- Dr. Denti ----------
     Arrives after the hero sequence, then says hello once per browser session; the greeting closes
     itself after 12 seconds (v2's denti-fab.js). */
  function Denti() {
    var o = useState(false),
      open = o[0],
      setOpen = o[1];
    var h = useState(false),
      hello = h[0],
      setHello = h[1];
    useEffect(function () {
      var seen = false;
      try {
        seen = sessionStorage.getItem("denti-hello") === "1";
      } catch {
        /* storage blocked: say hello anyway */
      }
      if (seen) return;
      var show = setTimeout(
        function () {
          setHello(true);
          try {
            sessionStorage.setItem("denti-hello", "1");
          } catch {
            /* storage blocked: say hello anyway */
          }
        },
        (intro ? 2400 : 300) + 1200,
      );
      var hide = setTimeout(
        function () {
          setHello(false);
        },
        (intro ? 2400 : 300) + 1200 + 12000,
      );
      return function () {
        clearTimeout(show);
        clearTimeout(hide);
      };
    }, []);
    return html`<${D.Reveal} as="aside" delay=${intro ? 2400 : 300} className="denti-fab">
      ${
        hello && !open
          ? html`<${D.DentiBubble}
              onDismiss=${function () {
                setHello(false);
              }}
              onOpen=${function () {
                setOpen(true);
                setHello(false);
              }}
            >
              <strong>Good morning, Dr. Smith!</strong> Your 12:00 slot is still open. Filling it is
              worth about $600.
            <//>`
          : null
      }
      ${
        open
          ? html`<${D.DentiPanel}
              id="denti-panel"
              title="Dr. Denti"
              subtitle="Your AI practice coach"
              state="happy"
              chips=${["Why is production up?", "Who should we call back?", "Write a review reply"]}
              onAsk=${function () {}}
              onClose=${function () {
                setOpen(false);
              }}
            >
              <p className="m-none">Here’s what I’d do first today:</p>
              <${D.DentiTips}>
                <li>Fill the <strong>12:00 open slot</strong> (about $600).</li>
                <li>Follow up on <strong>4 treatment plans</strong> (about $9,200).</li>
                <li>Reply to yesterday’s <strong>2-star review</strong>.</li>
              <//>
            <//>`
          : null
      }
      <${D.DentiLauncher}
        expanded=${open}
        controls="denti-panel"
        label="Open Dr. Denti, your AI practice coach"
        onClick=${function () {
          setOpen(!open);
          setHello(false);
        }}
      />
    <//>`;
  }

  // Production per day, as the old chart read it off the curve: thousands of dollars, today last.
  var production = [
    2.1, 2.6, 2.4, 3.2, 3.9, 3.1, 1.2, 1.4, 3.3, 3.6, 3.0, 4.1, 3.8, 1.5, 1.6, 3.5, 4.2, 3.9, 4.4,
    2.2, 1.3, 3.7,
  ];
  var productionDates = production.map(function (_, i) {
    return i === production.length - 1 ? "Today" : "Oct " + (5 + i);
  });
  var productionValues = production.map(function (v) {
    return "$" + Math.round(v * 1000).toLocaleString("en-US");
  });

  /* ---------- The page ---------- */
  function Page() {
    return html`<div className="app">
      <${Sidebar} active="home" />
      <main className="main">
        <${TopBar} />

        <section className="row" aria-label="Today">
          <${D.BriefingCard}
            className="grow"
            animate=${animate}
            greeting="Good morning, Dr. Smith"
            summary="Yesterday: 31 patients seen, $18,400 produced."
            value="$86,400"
            trend="positive"
            trendValue="+8%"
            goalLabel="72% of $120,000 monthly goal"
            goalPercent=${72}
            chart=${{
              points: production,
              projection: [4.0, 4.3, 4.1],
              values: productionValues,
              dates: productionDates,
              label: "Daily production",
              startLabel: "Oct 5",
              endLabel: "Today",
              todayValue: "$3,700",
              description:
                "Daily production, Oct 5 to today. Use the arrow keys to move between days.",
            }}
          />
          <${QuickWins} />
        </section>

        <section className="row">
          <${D.Reveal} index=${0} delay=${HOLD} className="grow">
            <${Schedule} />
          <//>
          <${D.Reveal} index=${1} delay=${HOLD} className="side-368">
            <${D.Card}
              className="h-full"
              title="Where new patients come from"
              subtitle="This month, by source"
            >
              <${D.BigNumber}
                animate=${animate}
                value="38"
                label="new patients · goal 50"
                trend="negative"
                trendValue="-4"
              />
              <${D.BarList}
                animate=${animate}
                spotlight
                items=${[
                  { label: "Google search", value: "14", number: 14 },
                  { label: "Patient referrals", value: "10", number: 10 },
                  { label: "Online ads", value: "8", number: 8 },
                  { label: "Website", value: "4", number: 4 },
                  { label: "Other", value: "2", number: 2 },
                ]}
              />
              <${D.Note} tone="brand">Referrals are up. Ask happy patients to share your link.<//>
            <//>
          <//>
        </section>

        <section className="section" aria-labelledby="products-title">
          <${D.Reveal} delay=${HOLD}>
            <h2 id="products-title" className="heading-sm m-none">Your products this month</h2>
          <//>
          <div className="product-cards">
            ${productCards.map(function (p, i) {
              return html`<${D.Reveal}
                key=${p.name}
                index=${i}
                delay=${HOLD}
                style=${{ flex: "1 0 0", minWidth: 0, display: "grid" }}
              >
                <${D.ProductCard} href="#" animate=${animate} ...${p} />
              <//>`;
            })}
          </div>
        </section>

        <section className="row">
          <${D.Reveal} index=${0} className="grow">
            <${D.Card}
              className="h-full"
              title="Calls handled by DentiVoice"
              subtitle="Every call answered, day and night"
              action=${html`<${D.Badge} color="success">100% answered<//>`}
            >
              <${D.BigNumber}
                animate=${animate}
                value="412"
                label="calls this month"
                trend="positive"
                trendValue="+12%"
              />
              <${D.StackedBar}
                animate=${animate}
                spotlight
                segments=${[
                  { label: "Booked a visit", value: 96 },
                  { label: "Answered questions", value: 228, series: 3 },
                  { label: "Sent to your team", value: 88, series: 4 },
                ]}
              />
              <${D.Note}
                >64 calls came after hours. DentiVoice booked 21 of them while you were closed.<//
              >
            <//>
          <//>
          <${D.Reveal} index=${1} className="side-368">
            <${D.Card} className="h-full" title="Your reputation" subtitle="Google reviews">
              <${D.Rating} animate=${animate} value=${4.8} note="12 new" label="Google rating" />
              <${D.BarList}
                animate=${animate}
                spotlight
                density="tight"
                tone="secondary"
                items=${[
                  { label: "5 stars", value: "9", number: 9 },
                  { label: "4 stars", value: "2", number: 2 },
                  { label: "2 stars", value: "1", number: 1, tone: "warning" },
                ]}
              />
              <${D.Note}
                footer=${html`<span
                  className="flex w-full items-center gap-xs"
                  style=${{ justifyContent: "space-between" }}
                >
                  <span>2 stars · yesterday</span>
                  <${D.Button} variant="neutral" size="sm">Reply<//>
                </span>`}
                >“Long wait at check-in, but the cleaning was great.”<//
              >
            <//>
          <//>
        </section>
      </main>
      <${Denti} />
    </div>`;
  }

  D.ReactDOM.createRoot(mount).render(
    html`<${D.TooltipProvider} delayDuration=${0}><${Page} /><//>`,
  );
})();
