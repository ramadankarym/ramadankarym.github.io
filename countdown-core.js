// One shared source for the Ramadan 1448 target and the "days left" number.
// app.js (main countdown), daily-card.js (daily card) and v10.js (journey bar) all read from here.
(function () {
  var TZ = 'Africa/Cairo';
  // Expected sunset of 7 Feb 2027 (first night of Ramadan 1448) and the first Fajr after it, Cairo time (+02:00).
  var targets = {
    sunset: new Date('2027-02-07T17:34:00+02:00'),
    fajr: new Date('2027-02-08T04:58:00+02:00')
  };
  var which = 'sunset';
  var RK = {
    tz: TZ,
    targets: targets,
    get which() { return which; },
    get target() { return targets[which]; },
    select: function (w) { if (targets[w]) which = w; },
    // Whole days left, exactly as the main countdown shows them: the day count flips at the target's time of day.
    daysLeft: function (now) {
      var remaining = Math.max(0, targets[which].getTime() - (now === undefined ? Date.now() : now));
      return Math.floor(Math.floor(remaining / 1000) / 86400);
    },
    // Today's calendar date in Cairo, so every visitor sees the same day no matter where their device is.
    cairoToday: function (now) {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
        .formatToParts(now ? new Date(now) : new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      return { year: +o.year, month: +o.month - 1, day: +o.day, dow: dow };
    }
  };
  window.RK = RK;
})();
