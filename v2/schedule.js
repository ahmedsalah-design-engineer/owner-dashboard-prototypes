/* Schedule · Owner dashboard v2. Same chrome as Home (shell.js). The page: the day in one line and
   one bar (as Home's "Today's schedule" card draws it), one card per chair, and Home's quick wins
   beside them, one line per job rather than one per patient. The day is the one Home summarises
   (18 visits, 3 chairs, 15 confirmed, 3 waiting, 2 open slots ~$1,200), so "Open schedule" lands on
   the same numbers. Every name and figure is an invented example. */
(function () {
  var D = window.DentalBase;
  var S = window.OwnerShell;
  var mount = document.getElementById("app");
  if (!D || !S || !mount) return;
  var html = D.html;
  var useState = D.React.useState;

  var intro = !/[?&]quick(=|&|$)/.test(location.search);

  /* ---------- Data (the prototype's example day) ---------- */
  var chairs = [
    { id: "c1", label: "Chair 1", provider: "Dr. Smith", tab: "Dr. Smith" },
    { id: "c2", label: "Chair 2", provider: "Dr. Patel", tab: "Dr. Patel" },
    { id: "c3", label: "Hygiene", provider: "Maya, RDH", tab: "Hygiene" },
  ];
  // [chair, time, minutes, patient, procedure, status, booked by DentiVoice]. A null patient is an open slot.
  var rows = [
    ["c1", "8:00", 60, "David Kim", "Exam", "ok"],
    ["c1", "9:00", 30, "Sarah Johnson", "Cleaning", "ok"],
    ["c1", "9:30", 120, "Omar Haddad", "Crown fitting", "ok"],
    ["c1", "11:30", 30, "Marcus Lee", "Filling", "ok", true],
    ["c1", "12:00", 60, null],
    ["c1", "1:00", 90, "Grace Park", "Root canal", "wait"],
    ["c1", "2:30", 90, "Tom Rivera", "Filling", "ok", true],
    ["c1", "4:00", 60, "Aisha Bello", "Consult", "ok"],
    ["c2", "8:00", 90, "Ben Carter", "Extraction", "ok"],
    ["c2", "9:30", 60, "Nora Ali", "Filling", "ok", true],
    ["c2", "10:30", 90, "Lina Chen", "New patient exam", "wait", true],
    ["c2", "12:00", 120, "Jack Wu", "Crown prep", "ok"],
    ["c2", "2:00", 60, null],
    ["c2", "3:00", 60, "Emma Brooks", "Whitening", "ok"],
    ["c2", "4:00", 60, "Leo Martins", "Consult", "ok", true],
    ["c3", "8:00", 90, "Chloe Evans", "Deep cleaning", "ok"],
    ["c3", "9:30", 90, "Ryan Ortiz", "Deep cleaning", "ok"],
    ["c3", "11:00", 90, "Hannah Lee", "Cleaning and X-rays", "wait"],
    ["c3", "1:00", 90, "Sam Nguyen", "Deep cleaning", "ok", true],
    ["c3", "2:30", 90, "Zoe Adams", "Cleaning and X-rays", "ok"],
  ];
  var VALUE_PER_HOUR = 600; // about what an hour of chair time brings in

  var visits = rows.map(function (r, i) {
    var name = r[3];
    return {
      id: "v" + i,
      chair: r[0],
      time: r[1],
      minutes: r[2],
      open: !name,
      name: name || "Open slot",
      initials: name
        ? name
            .split(" ")
            .map(function (w) {
              return w[0];
            })
            .join("")
        : "",
      procedure: r[4],
      waiting: r[5] === "wait",
      ai: !!r[6],
      value: name ? 0 : (r[2] / 60) * VALUE_PER_HOUR,
    };
  });

  function length(m) {
    var h = Math.floor(m / 60),
      r = m % 60;
    if (!h) return r + " min";
    return r ? h + " h " + r + " min" : h + " h";
  }
  function money(n) {
    return "$" + n.toLocaleString("en-US");
  }
  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }
  function booked(list) {
    return list.filter(function (v) {
      return !v.open;
    });
  }
  function waitingOf(list) {
    return list.filter(function (v) {
      return v.waiting;
    });
  }
  function openOf(list) {
    return list.filter(function (v) {
      return v.open;
    });
  }
  function valueOf(list) {
    return list.reduce(function (s, v) {
      return s + v.value;
    }, 0);
  }

  /* ---------- A visit, in a chair card ---------- */
  function Visit(props) {
    var v = props.v;
    if (v.open)
      return html`<${D.VisitRow}
        time=${v.time}
        name="Open slot"
        detail=${length(v.minutes) + " · about " + money(v.value) + " if filled"}
        open
        action=${html`<${D.Button} size="sm" attention>Fill slot<//>`}
      />`;
    // An unconfirmed visit carries its own call button, so nothing has to repeat it elsewhere.
    return html`<${D.VisitRow}
      time=${v.time}
      name=${v.name}
      initials=${v.initials}
      detail=${v.procedure + " · " + length(v.minutes) + (v.ai ? " · booked by DentiVoice" : "")}
      status=${
        v.waiting
          ? html`<span className="schedule-status">
              <${D.Badge} color="warning">Waiting to confirm<//>
              <${D.IconButton} icon="phone" label=${"Call " + v.name} variant="ghost" size="sm" />
            </span>`
          : html`<${D.Badge} color="success">Confirmed<//>`
      }
    />`;
  }

  function ChairCard(props) {
    var c = props.chair;
    var own = visits.filter(function (v) {
      return v.chair === c.id;
    });
    return html`<${D.Card}
      title=${c.label}
      subtitle=${c.provider + " · " + plural(booked(own).length, "visit", "visits")}
    >
      <ul className="m-none p-none flex flex-col">
        ${own.map(function (v) {
          return html`<${Visit} key=${v.id} v=${v} />`;
        })}
      </ul>
    <//>`;
  }

  /* ---------- The day in one line and one bar, as Home draws it ---------- */
  function Summary(props) {
    var b = booked(props.visits);
    var waiting = waitingOf(props.visits).length;
    var open = openOf(props.visits);
    var value = valueOf(open);
    var subtitle =
      plural(b.length, "visit", "visits") +
      " · " +
      plural(props.chairs, "chair", "chairs") +
      " · " +
      props.percent +
      "% of chair time booked";
    return html`<${D.Card} title=${props.title} subtitle=${subtitle}>
      <${D.StackedBar}
        animate=${intro}
        spotlight
        label=${
          b.length -
          waiting +
          " confirmed, " +
          waiting +
          " waiting to confirm, " +
          open.length +
          " open slots worth about " +
          money(value)
        }
        segments=${[
          { label: "Confirmed", value: b.length - waiting, series: 5 },
          { label: "Waiting to confirm", value: waiting, series: 6 },
          {
            label: open.length ? "Open slots · ~" + money(value) : "Open slots",
            value: open.length,
            series: 1,
          },
        ]}
      />
    <//>`;
  }

  /* ---------- Quick wins: Home's card, one line per job, following the tab ---------- */
  function QuickWins(props) {
    var waiting = waitingOf(props.visits);
    var open = openOf(props.visits);
    var wins = [];
    if (waiting.length)
      wins.push({
        id: "confirm",
        icon: "calendar",
        tone: "warning",
        title: plural(waiting.length, "visit to confirm", "visits to confirm"),
        sub: waiting
          .map(function (v) {
            return v.name.split(" ")[0];
          })
          .join(", "),
        action: waiting.length === 1 ? "Confirm" : "Confirm all",
      });
    if (open.length)
      wins.push({
        id: "fill",
        icon: "plus",
        tone: "brand",
        title: plural(open.length, "open slot", "open slots"),
        sub: "~" + money(valueOf(open)) + " · DentiVoice asks the waitlist",
        action: "Fill",
        primary: true,
      });

    // done: ticked; leaving: folding away a beat later; gone: removed. Keyed by tab, so ticking a
    // win on one chair does not tick the whole day's.
    var s = useState({}),
      done = s[0],
      setDone = s[1];
    var l = useState({}),
      leaving = l[0],
      setLeaving = l[1];
    var g = useState({}),
      gone = g[0],
      setGone = g[1];
    var keyOf = function (w) {
      return props.tab + ":" + w.id;
    };
    var mark = function (setter, k) {
      setter(function (prev) {
        var n = Object.assign({}, prev);
        n[k] = true;
        return n;
      });
    };
    var toggle = function (k) {
      return function () {
        if (done[k]) return;
        mark(setDone, k);
        setTimeout(function () {
          mark(setLeaving, k);
        }, 750); // let the tick read before it leaves
        setTimeout(function () {
          mark(setGone, k);
        }, 1400); // after the fold
      };
    };
    var left = wins.filter(function (w) {
      return !done[keyOf(w)];
    }).length;
    var allGone = wins.every(function (w) {
      return gone[keyOf(w)];
    });

    return html`<${D.Card}
      title="Quick wins"
      subtitle=${left ? left + " left today" : "All done for today"}
      action=${left ? html`<${D.Badge} color="brand" variant="solid">${left}<//>` : null}
      gap="sm"
    >
      ${
        wins.length
          ? html`<${D.ProgressBar}
              segments=${wins.length}
              filled=${wins.length - left}
              label="Quick wins done"
            />`
          : null
      }
      ${
        !allGone
          ? html`<ul className="m-none p-none flex flex-col">
              ${wins.map(function (w) {
                var k = keyOf(w);
                return gone[k]
                  ? null
                  : html`<${D.QuickWinItem}
                      key=${k}
                      icon=${w.icon}
                      tone=${w.tone}
                      title=${w.title}
                      sub=${w.sub}
                      done=${!!done[k]}
                      leaving=${!!leaving[k]}
                      onToggle=${toggle(k)}
                      action=${html`<${D.Button}
                        size="sm"
                        variant=${w.primary ? "primary" : "neutral"}
                        onClick=${toggle(k)}
                        >${w.action}<//
                      >`}
                    />`;
              })}
            </ul>`
          : html`<${D.QuickWinEmpty}
              title="You’re all caught up"
              text="Every visit is confirmed and every slot is filled."
              resetLabel=${wins.length ? "Show them again" : undefined}
              onReset=${function () {
                setDone({});
                setLeaving({});
                setGone({});
              }}
            />`
      }
    <//>`;
  }

  /* ---------- The page ---------- */
  function Page() {
    var t = useState("all"),
      tab = t[0],
      setTab = t[1];
    var shown = chairs.filter(function (c) {
      return tab === "all" || c.id === tab;
    });
    var ids = shown.map(function (c) {
      return c.id;
    });
    var inView = visits.filter(function (v) {
      return ids.indexOf(v.chair) !== -1;
    });
    // Chair time: the office is open 8 to 5, nine hours a chair.
    var bookedMinutes = booked(inView).reduce(function (s, v) {
      return s + v.minutes;
    }, 0);
    var percent = Math.round((bookedMinutes / (shown.length * 9 * 60)) * 100);

    var tabs = [{ value: "all", label: "All chairs", count: booked(visits).length }].concat(
      chairs.map(function (c) {
        return {
          value: c.id,
          label: c.tab,
          count: booked(
            visits.filter(function (v) {
              return v.chair === c.id;
            }),
          ).length,
        };
      }),
    );

    return html`<div className="app">
      <${S.Sidebar} active="schedule" />
      <main className="main">
        <${S.TopBar} />

        <${D.Reveal} delay=${0}>
          <${D.PageHeader}
            title="Schedule"
            description="Today · Tuesday, November 3"
            actions=${html`<div className="schedule-actions">
              <${D.IconButton} icon="chevron-left" label="Previous day" />
              <${D.Button} variant="neutral" disabled>Today<//>
              <${D.IconButton} icon="chevron-right" label="Next day" />
              <${D.Button} leadingIcon="plus">Book visit<//>
            </div>`}
          />
        <//>

        <${D.TabList} items=${tabs} value=${tab} onChange=${setTab} />

        <section className="row" aria-label="The day by chair">
          <${D.Reveal} as="div" cascade delay=${intro ? 150 : 0} className="grow schedule-chairs">
            <${Summary} title="Today" visits=${inView} chairs=${shown.length} percent=${percent} />
            ${shown.map(function (c) {
              return html`<${ChairCard} key=${c.id} chair=${c} />`;
            })}
          <//>
          <${D.Reveal} index=${1} delay=${intro ? 150 : 0} className="side-448 schedule-side">
            <${QuickWins} tab=${tab} visits=${inView} />
          <//>
        </section>
      </main>
    </div>`;
  }

  D.ReactDOM.createRoot(mount).render(
    html`<${D.TooltipProvider} delayDuration=${0}><${Page} /><//>`,
  );
})();
