(() => {
  // غروب الشمس المتوقع في المنصورة، الدقهلية، يوم ٧ فبراير ٢٠٢٧: ٥:٣٤ م بتوقيت مصر (UTC+02).
  const countdownTarget = new Date('2027-02-07T17:34:00+02:00');
  // اليوم المدني الأول من رمضان المتوقع هو الاثنين ٨ فبراير ٢٠٢٧.
  const ramadanDay = new Date('2027-02-08T12:00:00+02:00');
  const byId = (id) => document.getElementById(id);
  const nodes = {
    days: byId('days'),
    hours: byId('hours'),
    minutes: byId('minutes'),
    seconds: byId('seconds'),
    status: byId('timer-status'),
    hijri: byId('ramadan-date'),
    gregorian: byId('gregorian-date'),
    today: byId('today-date'),
    sunset: byId('sunset-date'),
    share: byId('share-button'),
    shareLabel: byId('share-label'),
    audio: byId('ramadan-music'),
    musicToggle: byId('music-toggle'),
    musicLabel: byId('music-label'),
    ambienceStatus: byId('ambience-status'),
    motionToggle: byId('motion-toggle'),
    motionLabel: byId('motion-label'),
  };

  const LANG = (document.documentElement.lang || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar';
  const T = LANG === 'en' ? {
    locale: 'en-GB', hijriLocale: 'en-u-ca-islamic-umalqura', todayHijriLocale: 'en-u-ca-islamic',
    numPad: '0', todayPrefix: 'Today in Egypt: ', sunsetPrefix: 'Expected sunset in Mansoura, Dakahlia: ',
    ramadanArrived: 'Ramadan night has arrived - Ramadan Mubarak, may Allah accept our good deeds',
    closer: 'One moment closer to the month of mercy',
    shareTitle: 'Ramadan 1448 Countdown',
    shareText: 'Ramadan is almost here - follow the countdown and make your own greeting video.',
    shareLabel: 'Share the countdown', copied: 'Link copied',
    shareFail: 'Could not share; copy the link from the browser',
    motionOn: 'Turn motion off', motionOff: 'Turn motion on',
    musicOn: 'Play Ramadan music', musicOff: 'Stop the music',
    musicStopped: 'Music stopped', musicPlaying: 'Soft Ramadan music playing',
    musicFail: 'Could not play the music; please try again.',
  } : {
    locale: 'ar-EG', hijriLocale: 'ar-SA-u-ca-islamic-umalqura', todayHijriLocale: 'ar-EG-u-ca-islamic',
    numPad: '٠', todayPrefix: 'اليوم في مصر: ', sunsetPrefix: 'غروب المنصورة، الدقهلية المتوقع: ',
    ramadanArrived: 'حان مغرب ليلة رمضان — رمضان مبارك، تقبّل الله منّا ومنكم صالح الأعمال',
    closer: 'لحظةٌ أقرب إلى شهر الرحمة',
    shareTitle: 'العدّ التنازلي لرمضان ١٤٤٨ هـ',
    shareText: 'بقيت أيام قليلة على شهر رمضان المبارك — تابع العدّ التنازلي معنا.',
    shareLabel: 'شارك العدّ التنازلي', copied: 'تم نسخ الرابط',
    shareFail: 'تعذّرت المشاركة، انسخ الرابط من المتصفح',
    motionOn: 'إيقاف الحركة', motionOff: 'تشغيل الحركة',
    musicOn: 'تشغيل موسيقى رمضانية', musicOff: 'إيقاف الموسيقى',
    musicStopped: 'تم إيقاف الموسيقى', musicPlaying: 'تعمل الآن موسيقى رمضانية هادئة',
    musicFail: 'تعذّر تشغيل الموسيقى؛ يمكنك المحاولة مجددًا.',
  };
  const numberFormat = new Intl.NumberFormat(LANG === 'en' ? 'en-US' : 'ar-EG', { useGrouping: false });
  const hijriFormatter = new Intl.DateTimeFormat(T.hijriLocale, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Cairo',
  });
  const weekdayFormatter = new Intl.DateTimeFormat(T.locale, {
    weekday: 'long', timeZone: 'Africa/Cairo',
  });
  const gregorianFormatter = new Intl.DateTimeFormat(T.locale, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Cairo',
  });
  const sunsetDateFormatter = new Intl.DateTimeFormat(T.locale, {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Cairo',
  });
  const sunsetTimeFormatter = new Intl.DateTimeFormat(T.locale, {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Cairo',
  });
  const todayFormatter = new Intl.DateTimeFormat(T.todayHijriLocale, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Cairo',
  });
  const cairoDatePartsFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Africa/Cairo',
  });

  // معايرة مصرية: صيغة ar-EG مع طرح يوم لمطابقة التواريخ التي أكدها المستخدم.
  const HIJRI_DAY_OFFSET = -1;
  let renderedTodayKey = '';
  function updateTodayDate() {
    const now = new Date();
    const dateParts = cairoDatePartsFormatter.formatToParts(now);
    const year = Number(dateParts.find((part) => part.type === 'year').value);
    const month = Number(dateParts.find((part) => part.type === 'month').value);
    const day = Number(dateParts.find((part) => part.type === 'day').value);
    const dateKey = `${year}-${month}-${day}`;
    if (dateKey === renderedTodayKey) return;
    renderedTodayKey = dateKey;
    const correctedDate = new Date(Date.UTC(year, month - 1, day + HIJRI_DAY_OFFSET, 12));
    const hijriText = todayFormatter.format(correctedDate).replace('ربيع الآخر', 'ربيع الثاني');
    nodes.today.textContent = `${T.todayPrefix}${hijriText}`;
  }

  nodes.hijri.textContent = hijriFormatter.format(ramadanDay);
  nodes.gregorian.textContent = `${weekdayFormatter.format(ramadanDay)}، ${gregorianFormatter.format(ramadanDay)}`;
  nodes.sunset.textContent = `${T.sunsetPrefix}${sunsetDateFormatter.format(countdownTarget)}، ${sunsetTimeFormatter.format(countdownTarget)}`;

  function updateCountdown() {
    updateTodayDate();
    const remaining = Math.max(0, countdownTarget.getTime() - Date.now());
    const secondsTotal = Math.floor(remaining / 1000);
    const days = Math.floor(secondsTotal / 86400);
    const hours = Math.floor((secondsTotal % 86400) / 3600);
    const minutes = Math.floor((secondsTotal % 3600) / 60);
    const seconds = secondsTotal % 60;

    nodes.days.textContent = numberFormat.format(days).padStart(3, T.numPad);
    nodes.hours.textContent = numberFormat.format(hours).padStart(2, T.numPad);
    nodes.minutes.textContent = numberFormat.format(minutes).padStart(2, T.numPad);
    nodes.seconds.textContent = numberFormat.format(seconds).padStart(2, T.numPad);
    nodes.status.textContent = remaining === 0
      ? T.ramadanArrived
      : T.closer;
  }

  async function shareCountdown() {
    const payload = {
      title: T.shareTitle,
      text: T.shareText,
      url: window.location.href,
    };
    const originalLabel = T.shareLabel;
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(payload.url);
      } else {
        const temporaryInput = document.createElement('textarea');
        temporaryInput.value = payload.url;
        temporaryInput.setAttribute('readonly', '');
        temporaryInput.style.position = 'fixed';
        temporaryInput.style.opacity = '0';
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand('copy');
        temporaryInput.remove();
        if (!copied) throw new Error('تعذّر نسخ الرابط');
      }
      nodes.shareLabel.textContent = T.copied;
      window.setTimeout(() => { nodes.shareLabel.textContent = originalLabel; }, 2200);
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      nodes.shareLabel.textContent = T.shareFail;
      window.setTimeout(() => { nodes.shareLabel.textContent = originalLabel; }, 2800);
    }
  }

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = !motionPreference.matches;
  function setMotionEnabled(enabled) {
    motionEnabled = Boolean(enabled);
    const root = document.documentElement;
    root.classList.toggle('motion-paused', !motionEnabled);
    root.classList.toggle('motion-user-enabled', motionEnabled && motionPreference.matches);
    nodes.motionToggle.setAttribute('aria-pressed', String(motionEnabled));
    nodes.motionLabel.textContent = motionEnabled ? T.motionOn : T.motionOff;
  }

  let musicEnabled = false;
  let volumeAnimation = 0;
  nodes.audio.volume = 0;
  function setMusicButton(enabled) {
    musicEnabled = Boolean(enabled);
    nodes.musicToggle.setAttribute('aria-pressed', String(musicEnabled));
    nodes.musicLabel.textContent = musicEnabled ? T.musicOff : T.musicOn;
  }

  function fadeVolume(target, duration, onComplete) {
    if (volumeAnimation) window.cancelAnimationFrame(volumeAnimation);
    const startVolume = nodes.audio.volume;
    const startedAt = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      nodes.audio.volume = startVolume + (target - startVolume) * progress;
      if (progress < 1) {
        volumeAnimation = window.requestAnimationFrame(step);
      } else {
        volumeAnimation = 0;
        if (onComplete) onComplete();
      }
    }
    volumeAnimation = window.requestAnimationFrame(step);
  }

  async function toggleMusic() {
    if (musicEnabled) {
      setMusicButton(false);
      nodes.ambienceStatus.textContent = T.musicStopped;
      fadeVolume(0, 450, () => nodes.audio.pause());
      return;
    }
    try {
      nodes.audio.volume = 0;
      await nodes.audio.play();
      setMusicButton(true);
      nodes.ambienceStatus.textContent = T.musicPlaying;
      fadeVolume(.22, 800);
    } catch (error) {
      setMusicButton(false);
      nodes.ambienceStatus.textContent = T.musicFail;
    }
  }

  nodes.share.addEventListener('click', shareCountdown);
  nodes.musicToggle.addEventListener('click', toggleMusic);
  nodes.motionToggle.addEventListener('click', () => setMotionEnabled(!motionEnabled));
  const handleMotionPreference = (event) => {
    if (event.matches) setMotionEnabled(false);
  };
  if (motionPreference.addEventListener) motionPreference.addEventListener('change', handleMotionPreference);
  else if (motionPreference.addListener) motionPreference.addListener(handleMotionPreference);

  setMotionEnabled(motionEnabled);
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
})();
