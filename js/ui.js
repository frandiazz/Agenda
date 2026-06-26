const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const PRIORITIES = { 1: 'P1 - Urgente', 2: 'P2 - Importante', 3: 'P3 - Normal', 4: 'P4 - Baja' };

const UI = {
  _formatDate(d) {
    if (typeof d === 'string') d = new Date(d + 'T12:00:00');
    return `${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  },

  _formatDateShort(d) {
    if (typeof d === 'string') d = new Date(d + 'T12:00:00');
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  },

  _toDateStr(d) {
    return d.toISOString().slice(0, 10);
  },

  _parseTime(t) {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  },

  _timeLabel(h) {
    return `${String(h).padStart(2, '0')}:00`;
  },

  _catStyle(id) {
    const cat = AgendaData.getCategories().find(c => c.id === id);
    return cat ? cat.color : '#666';
  },

  _catClass(id) {
    return `cat-${id}`;
  },

  _esc(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  _categoryOption(cat, selected) {
    return `<option value="${cat.id}" ${cat.id === selected ? 'selected' : ''}>${cat.icon} ${cat.label}</option>`;
  },

  // ---------- Toast ----------
  toast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
  },

  // ---------- View renderers ----------

  renderToday(state) {
    const today = state.currentDate;
    const dateStr = this._toDateStr(today);
    const events = AgendaData.getEventsByDate(dateStr);
    const tasks = AgendaData.getTasks();
    const habits = AgendaData.getHabits();
    const notes = AgendaData.getNotesByDate(dateStr);
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const todayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== 'done');
    const todayHabits = habits.filter(h => h.logs && h.logs[dateStr]);

    const now = new Date();
    const currentHour = now.getHours();
    const currentEvents = events.filter(e => {
      const startH = parseInt(e.startTime);
      const endH = e.endTime ? parseInt(e.endTime) : startH + 1;
      if (endH <= startH) {
        return currentHour >= startH || currentHour < endH;
      }
      return currentHour >= startH && currentHour < endH;
    });

    let html = `<div class="view"><div class="today-grid">`;

    // Stats row
    html += `<div class="today-full"><div class="stats-row">
      <div class="stat-card"><span class="stat-icon">📅</span><div class="stat-value">${events.length}</div><div class="stat-label">Eventos hoy</div></div>
      <div class="stat-card"><span class="stat-icon">✅</span><div class="stat-value">${pendingTasks.length}</div><div class="stat-label">Tareas pendientes</div></div>
      <div class="stat-card"><span class="stat-icon">🔄</span><div class="stat-value">${todayHabits.length}/${habits.length}</div><div class="stat-label">Hábitos hoy</div></div>
      <div class="stat-card"><span class="stat-icon">📝</span><div class="stat-value">${notes.length}</div><div class="stat-label">Notas hoy</div></div>
    </div></div>`;

    // Timeline
    html += `<div class="card today-full"><div class="section-title">⏰ En este momento</div>`;
    if (currentEvents.length) {
      html += `<div style="display:flex;gap:12px;">`;
      html += `<div class="timeline-dot" style="margin-top:8px;"></div>`;
      html += `<div style="flex:1;display:flex;flex-direction:column;gap:8px;">`;
      currentEvents.forEach(ev => {
        const c = this._catStyle(ev.category);
        const recBadge = AgendaData.isRecurring(ev) ? '🔄 ' : '';
        html += `<div class="event-row" style="border-left:3px solid ${c};" onclick="App.openEventForm('${dateStr}', ${parseInt(ev.startTime)}, '${ev.id}')">
          <div class="event-dot" style="background:${c};"></div>
          <div class="event-info"><div class="event-title">${recBadge}${this._esc(ev.title)}</div></div>
          <span class="event-time-pill">${ev.startTime}${ev.endTime ? ' - ' + ev.endTime : ''}</span>
        </div>`;
      });
      html += `</div></div>`;
    } else {
      html += `<div style="display:flex;align-items:center;gap:12px;color:var(--text-muted);font-size:0.85rem;">
        <div class="timeline-dot"></div>
        <span>Sin eventos en curso</span>
      </div>`;
    }
    html += `</div>`;

    // Events today
    html += `<div class="card"><div class="section-title">📅 Eventos de hoy</div>`;
    if (events.length) {
      html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
      events.sort((a, b) => a.startTime.localeCompare(b.startTime)).forEach(ev => {
        const c = this._catStyle(ev.category);
        const recBadge = AgendaData.isRecurring(ev) ? '🔄 ' : '';
        html += `<div class="event-row" style="border-left:3px solid ${c};" onclick="App.openEventForm('${dateStr}', ${parseInt(ev.startTime)}, '${ev.id}')">
          <div class="event-dot" style="background:${c};"></div>
          <div class="event-info"><div class="event-title">${recBadge}${this._esc(ev.title)}</div></div>
          <span class="event-time-pill">${ev.startTime}</span>
        </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div style="color:var(--text-muted);font-size:0.85rem;">No hay eventos programados</div>`;
    }
    html += `<div style="margin-top:12px;"><button class="btn-primary btn-sm" onclick="App.openEventForm('${dateStr}')">+ Agregar evento</button></div>`;
    html += `</div>`;

    // Tasks
    html += `<div class="card"><div class="section-title">✅ Tareas prioritarias</div>`;
    if (todayTasks.length) {
      html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
      todayTasks.sort((a, b) => a.priority - b.priority).forEach(t => {
        const cat = AgendaData.getCategories().find(c => c.id === t.category);
        html += `<div class="event-row" data-id="${t.id}" style="padding:10px 16px;">
          <div class="check-anim ${t.status === 'done' ? 'checked' : ''}" onclick="App.toggleTaskItem('${t.id}')">
            <svg viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,3.5"/></svg>
          </div>
          <div class="event-info" onclick="App.openTaskForm('${t.id}')"><div class="event-title">${this._esc(t.title)}</div></div>
          <span class="badge badge-p${t.priority}">${PRIORITIES[t.priority].split(' ')[0]}</span>
          ${cat ? `<span class="badge badge-cat">${cat.icon}</span>` : ''}
        </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div style="color:var(--text-muted);font-size:0.85rem;">No hay tareas para hoy</div>`;
    }
    html += `<div style="margin-top:12px;"><button class="btn-primary btn-sm" onclick="App.openTaskForm()">+ Nueva tarea</button></div>`;
    html += `</div>`;

    // Habits today
    html += `<div class="card"><div class="section-title">🔄 Hábitos de hoy</div><div style="display:flex;flex-direction:column;gap:8px;">`;
    if (habits.length) {
      habits.forEach(h => {
        const done = h.logs && h.logs[dateStr];
        html += `<div class="event-row" style="padding:8px 14px;cursor:default;" data-id="${h.id}">
          <div class="habit-cell ${done ? 'done' : ''} today" style="width:26px;height:26px;flex-shrink:0;cursor:pointer;" onclick="App.toggleHabitItem('${h.id}','${dateStr}')"></div>
          <div class="event-info"><span style="font-size:0.88rem;color:var(--text-primary);">${this._esc(h.name)}</span></div>
          ${h.streak > 0 ? `<span class="streak-pill">🔥 ${h.streak}</span>` : ''}
        </div>`;
      });
    } else {
      html += `<div style="color:var(--text-muted);font-size:0.85rem;">Sin hábitos creados</div>`;
    }
    html += `<div style="margin-top:8px;"><button class="btn-primary btn-sm" onclick="App.openHabitForm()">+ Nuevo hábito</button></div>`;
    html += `</div></div>`;

    // Notes today
    html += `<div class="card"><div class="section-title">📝 Notas rápidas</div>`;
    if (notes.length) {
      html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
      notes.forEach(n => {
        const hash = n.title ? n.title.length + (n.content ? n.content.length : 0) : 0;
        const colors = ['#6C63FF','#00D4FF','#FF6B9D','#2ECC71','#FFA46C','#CE93D8'];
        const accent = colors[hash % colors.length];
        html += `<div class="event-row" style="border-left:3px solid ${accent};padding:10px 14px;" onclick="App.openNoteForm('${n.id}')">
          <div class="event-info">
            <div class="event-title">${this._esc(n.title || 'Sin título')}</div>
            ${n.content ? `<div style="font-size:0.76rem;color:var(--text-secondary);margin-top:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${this._esc(n.content)}</div>` : ''}
          </div>
          <span class="event-time-pill">${n.date ? this._formatDateShort(n.date) : ''}</span>
        </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div style="color:var(--text-muted);font-size:0.85rem;">Sin notas hoy</div>`;
    }
    html += `<div style="margin-top:12px;"><button class="btn-primary btn-sm" onclick="App.openNoteForm()">+ Nueva nota</button></div>`;
    html += `</div>`;

    html += `</div></div>`;
    return html;
  },

  renderDaily(state) {
    const dateStr = this._toDateStr(state.currentDate);
    const events = AgendaData.getEventsByDate(dateStr);
    const startH = 0;
    const endH = 23;
    const now = new Date();
    const currentHour = now.getHours();
    const isToday = dateStr === this._toDateStr(now);

    const eventMap = {};
    events.forEach(ev => {
      const start = parseInt(ev.startTime);
      const end = ev.endTime ? parseInt(ev.endTime) : start + 1;
      const crosses = end <= start;
      const maxH = crosses ? 23 : end - 1;
      for (let h = start; h <= maxH; h++) {
        if (!eventMap[h]) eventMap[h] = [];
        if (!eventMap[h].find(e => e.id === ev.id)) eventMap[h].push(ev);
      }
      if (crosses) {
        for (let h = 0; h < end; h++) {
          if (!eventMap[h]) eventMap[h] = [];
          if (!eventMap[h].find(e => e.id === ev.id)) eventMap[h].push(ev);
        }
      }
    });

    let html = `<div class="view"><div class="hourly-grid">`;
    for (let h = startH; h <= endH; h++) {
      const timeLabel = this._timeLabel(h);
      const hourEvents = eventMap[h] || [];
      const isPast = isToday && h < currentHour;
      const isCurrent = isToday && h === currentHour;
      const cls = `hour-content ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''} ${hourEvents.length === 0 ? 'empty' : ''}`;

      html += `<div class="hour-slot">
        <div class="hour-label">${timeLabel}</div>
        <div style="position:relative;">
          ${isCurrent ? `<div class="hour-current-bar"></div>` : ''}
          <div class="${cls}" data-hour="${h}" onclick="App.openEventForm('${dateStr}', ${h})">
            ${hourEvents.map(ev => {
              const c = this._catStyle(ev.category);
              const cat = AgendaData.getCategories().find(ca => ca.id === ev.category);
              const recBadge = AgendaData.isRecurring(ev) ? '🔄 ' : '';
              const isFirst = parseInt(ev.startTime) === h;
              return `<div class="event-block ${ev.completed ? 'completed' : ''}" style="background:${c}22;border-left:3px solid ${c};color:${c};opacity:${isFirst ? 1 : 0.6};" data-id="${ev.id}" onclick="event.stopPropagation();App.openEventForm('${dateStr}', ${h}, '${ev.id}')">
                ${!isFirst ? '↳ ' : ''}${cat ? cat.icon + ' ' : ''}${recBadge}${this._esc(ev.title)}
                ${isFirst && ev.endTime ? `<span class="event-time">${ev.startTime}-${ev.endTime}</span>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
    }
    html += `</div></div>`;
    return html;
  },

  renderWeekly(state) {
    const today = new Date();
    const todayStr = this._toDateStr(today);
    const monday = new Date(state.currentDate);
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));

    const allEvents = AgendaData.getEvents();
    const eventMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const dStr = this._toDateStr(d);
      allEvents.forEach(ev => {
        if (ev.date === dStr && !AgendaData.isRecurring(ev)) {
          if (!eventMap[dStr]) eventMap[dStr] = [];
          if (!eventMap[dStr].find(e => e.id === ev.id)) eventMap[dStr].push(ev);
        }
        if (AgendaData.isRecurring(ev) && AgendaData.isRecurringOnDate(ev, dStr)) {
          if (!eventMap[dStr]) eventMap[dStr] = [];
          if (!eventMap[dStr].find(e => e.id === ev.id)) eventMap[dStr].push(ev);
        }
      });
    }

    const currentMonth = state.currentDate.getMonth();

    let html = `<div class="view"><div class="week-grid">`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const dStr = this._toDateStr(d);
      const dayEvents = eventMap[dStr] || [];
      const isToday = dStr === todayStr;
      const isOther = d.getMonth() !== currentMonth;

      const cats = [...new Set(dayEvents.map(ev => ev.category))].slice(0, 4);

      html += `<div class="week-day ${isToday ? 'today' : ''} ${isOther ? 'other-month' : ''}" onclick="App.goToDate('${dStr}')">
        <div class="week-day-name">${DAYS_SHORT[d.getDay()]}</div>
        <div class="week-day-num">${d.getDate()}</div>
        ${isToday ? `<div class="week-today-bar"></div>` : ''}
        <div class="week-events">
          ${dayEvents.slice(0, 3).map(ev => {
            const cat = AgendaData.getCategories().find(c => c.id === ev.category);
            const c = cat ? cat.color : '#666';
            const recBadge = AgendaData.isRecurring(ev) ? '🔄' : '';
            return `<div class="week-event" style="background:${c}33;border-left:2px solid ${c}">${recBadge} ${UI._esc(ev.title)}</div>`;
          }).join('')}
          ${dayEvents.length > 0 ? `<div class="week-dots">${cats.map(c => {
            const cat = AgendaData.getCategories().find(ca => ca.id === c);
            return `<div class="month-dot" style="background:${cat ? cat.color : '#666'}"></div>`;
          }).join('')}</div>` : ''}
          ${dayEvents.length > 3 ? `<div style="font-size:0.68rem;color:var(--text-muted);text-align:center;">+${dayEvents.length - 3} más</div>` : ''}
        </div>
      </div>`;
    }
    html += `</div></div>`;
    return html;
  },

  renderMonthly(state) {
    const today = new Date();
    const todayStr = this._toDateStr(today);
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const startDate = new Date(year, month, 1 - startPad);
    const endDate = new Date(year, month + 1, 0);
    if (endDate.getDay() !== 0) {
      endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
    }

    const allEvents = AgendaData.getEvents();
    const eventMap = {};
    const iterDate = new Date(startDate);
    while (iterDate <= endDate) {
      const dStr = this._toDateStr(iterDate);
      allEvents.forEach(ev => {
        if (ev.date === dStr && !AgendaData.isRecurring(ev)) {
          if (!eventMap[dStr]) eventMap[dStr] = [];
          if (!eventMap[dStr].find(e => e.id === ev.id)) eventMap[dStr].push(ev);
        }
        if (AgendaData.isRecurring(ev) && AgendaData.isRecurringOnDate(ev, dStr)) {
          if (!eventMap[dStr]) eventMap[dStr] = [];
          if (!eventMap[dStr].find(e => e.id === ev.id)) eventMap[dStr].push(ev);
        }
      });
      iterDate.setDate(iterDate.getDate() + 1);
    }

    let html = `<div class="view"><div class="month-grid">`;
    DAYS_SHORT.forEach(d => {
      html += `<div class="month-header-cell">${d}</div>`;
    });

    const iterDate2 = new Date(startDate);
    while (iterDate2 <= endDate) {
      const dStr = this._toDateStr(iterDate2);
      const dayEvents = eventMap[dStr] || [];
      const isToday = dStr === todayStr;
      const isOther = iterDate2.getMonth() !== month;

      const cats = [...new Set(dayEvents.map(ev => ev.category))].slice(0, 5);
      html += `<div class="month-day ${isToday ? 'today' : ''} ${isOther ? 'other-month' : ''}" onclick="App.goToDate('${dStr}')">
        <div class="month-day-num">${iterDate2.getDate()}</div>
        ${dayEvents.length > 0 ? `<span class="month-day-badge">${dayEvents.length}</span>` : ''}
        <div class="month-dots">
          ${cats.map(c => {
            const cat = AgendaData.getCategories().find(ca => ca.id === c);
            return `<div class="month-dot" style="background:${cat ? cat.color : '#666'}"></div>`;
          }).join('')}
        </div>
      </div>`;
      iterDate2.setDate(iterDate2.getDate() + 1);
    }
    html += `</div></div>`;
    return html;
  },

  renderGym(state) {
    const routines = AgendaData.getGymRoutines();

    let html = `<div class="view"><div class="view-header">
      <div class="view-title">🏋️ Gimnasio</div>
      <div class="view-actions">
        <button class="btn-primary" onclick="App.openGymForm()">+ Nuevo entrenamiento</button>
      </div>
    </div>`;

    if (routines.length === 0) {
      html += `<div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
        <div style="font-size:4rem;margin-bottom:16px;">🏋️</div>
        <div style="font-size:1.1rem;font-weight:600;margin-bottom:8px;color:var(--text-primary);">Todavía no hay entrenamientos</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:20px;">Registrá tu primera rutina de gym</div>
        <button class="btn-primary" onclick="App.openGymForm()">💪 Empezar entrenamiento</button>
      </div></div>`;
      return html;
    }

    routines.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    html += `<div class="gym-grid">`;
    routines.forEach(r => {
      const exCount = (r.exercises || []).length;
      const totalVolume = (r.exercises || []).reduce((sum, ex) =>
        sum + (ex.sets || []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0);
      const totalSets = (r.exercises || []).reduce((sum, ex) => sum + (ex.sets || []).length, 0);
      const doneSets = (r.exercises || []).reduce((sum, ex) => sum + (ex.sets || []).filter(s => s.done).length, 0);

      html += `<div class="gym-card" onclick="App.openGymForm('${r.id}')">
        <div class="gym-card-header">
          <div class="gym-card-icon">🏋️</div>
          <div class="gym-card-info">
            <div class="gym-card-name">${this._esc(r.name || 'Entrenamiento')}</div>
            <div class="gym-card-date">${r.date ? this._formatDateShort(r.date) : ''}</div>
          </div>
        </div>
        <div class="gym-card-stats">
          <span class="gym-badge">${exCount} ejercicios</span>
          <span class="gym-badge">${doneSets}/${totalSets} series</span>
          <span class="gym-badge">🏋️ ${totalVolume.toLocaleString()} kg</span>
        </div>
      </div>`;
    });
    html += `</div></div>`;
    return html;
  },

  renderTrips(state) {
    const trips = AgendaData.getDreamTrips();
    const categories = AgendaData.getCategories();

    let html = `<div class="view"><div class="view-header">
      <div class="view-title">✈️ Viajes Soñados</div>
      <div class="view-actions">
        <button class="btn-primary" onclick="App.openTripForm()">+ Nuevo viaje</button>
      </div>
    </div>`;

    if (trips.length === 0) {
      html += `<div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
        <div style="font-size:4rem;margin-bottom:16px;">✈️</div>
        <div style="font-size:1.1rem;font-weight:600;margin-bottom:8px;">Todavía no hay viajes soñados</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:20px;">Agregá tu primer destino y empezá a planear</div>
        <button class="btn-primary" onclick="App.openTripForm()">🌍 Agregar destino</button>
      </div></div>`;
      return html;
    }

    html += `<div class="trips-grid">`;
    trips.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).forEach(t => {
      const heroImg = t.images && t.images.length > 0 ? t.images[0] : null;
      const totalItems = t.bucketList ? t.bucketList.length : 0;
      const doneItems = t.bucketList ? t.bucketList.filter(i => i.done).length : 0;
      const statusClass = `trip-status-${t.status || 'dreaming'}`;
      const statusLabels = { dreaming: '💜 Soñando', planning: '🔵 Planeando', saving: '🟡 Ahorrando', booked: '🟢 Reservado', done: '✅ Hecho' };

      html += `<div class="trip-card glass" onclick="App.openTripForm('${t.id}')">
        <button class="trip-add-btn" onclick="event.stopPropagation();App.openTripForm('${t.id}')">✏️</button>
        ${heroImg
          ? `<div class="trip-bg" style="background-image:url('${this._esc(heroImg)}')"></div>`
          : `<div class="trip-placeholder"><span class="trip-placeholder-icon">🌍</span></div>`
        }
        <div class="trip-overlay"></div>
        <div class="trip-content">
          ${t.emoji ? `<span class="trip-emoji">${t.emoji}</span>` : ''}
          <div class="trip-name">${this._esc(t.destination || '')}</div>
          ${t.country ? `<div class="trip-country">${this._esc(t.country)}</div>` : ''}
          <div class="trip-stats">
            <span class="trip-status-badge ${statusClass}">${statusLabels[t.status || 'dreaming'] || '💜 Soñando'}</span>
            ${totalItems > 0 ? `<span class="trip-bucket-count">☑️ ${doneItems}/${totalItems}</span>` : ''}
          </div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
    return html;
  },

  renderGoals(state) {
    const goals = AgendaData.getGoals();
    const filter = state.goalFilter || 'all';

    let html = `<div class="view"><div class="view-header">
      <div class="view-title">🎯 Metas y Objetivos</div>
      <div class="view-actions">
        <select id="goalFilter" onchange="App.setGoalFilter(this.value)" style="width:auto;">
          <option value="all" ${filter === 'all' ? 'selected' : ''}>Todas</option>
          <option value="yearly" ${filter === 'yearly' ? 'selected' : ''}>Anuales</option>
          <option value="quarterly" ${filter === 'quarterly' ? 'selected' : ''}>Trimestrales</option>
          <option value="monthly" ${filter === 'monthly' ? 'selected' : ''}>Mensuales</option>
          <option value="weekly" ${filter === 'weekly' ? 'selected' : ''}>Semanales</option>
        </select>
        <button class="btn-primary" onclick="App.openGoalForm()">+ Nueva meta</button>
      </div>
    </div><div class="goals-grid">`;

    const filtered = filter === 'all' ? goals : goals.filter(g => g.timeframe === filter);
    if (filtered.length === 0) {
      html += `<div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">No hay metas. ¡Crea tu primera meta!</div>`;
    }
    const timeframeLabels = { yearly: 'Anual', quarterly: 'Trimestral', monthly: 'Mensual', weekly: 'Semanal' };
    filtered.forEach(g => {
      const cat = AgendaData.getCategories().find(c => c.id === g.category);
      html += `<div class="goal-card">
        <div class="goal-hero">
          <div class="goal-hero-icon">${cat ? cat.icon : '🎯'}</div>
          <div class="goal-hero-info">
            <div class="goal-hero-title">${this._esc(g.title)}</div>
            <div class="goal-hero-meta">
              <span class="badge badge-cat">${timeframeLabels[g.timeframe] || g.timeframe}</span>
              ${g.targetDate ? `<span style="margin-left:8px;">📅 ${this._formatDateShort(g.targetDate)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${g.progress}%;${cat ? `background:${cat.color};` : ''}"></div></div>
        <div class="goal-progress-text">${g.progress}% completado</div>
        ${g.description ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px;">${this._esc(g.description)}</div>` : ''}
        ${g.milestones && g.milestones.length ? `<div class="milestones">
          ${g.milestones.map((m, i) => `
            <div class="milestone ${m.done ? 'done' : ''}">
              <span class="milestone-check ${m.done ? 'checked' : ''}" onclick="App.toggleMilestoneItem('${g.id}', ${i})">${m.done ? '✓' : ''}</span>
              ${this._esc(m.title)}
            </div>
          `).join('')}
        </div>` : ''}
        <div style="display:flex;gap:8px;margin-top:14px;">
          <button class="btn-secondary btn-sm" onclick="App.openGoalForm('${g.id}')">✏️ Editar</button>
          <button class="btn-danger btn-sm" onclick="App.deleteGoalItem('${g.id}')">🗑️ Eliminar</button>
        </div>
      </div>`;
    });
    html += `</div></div>`;
    return html;
  },

  renderTasks(state) {
    const tasks = AgendaData.getTasks();
    const { taskFilterCat, taskFilterPri, taskFilterStatus } = state;

    let filtered = [...tasks];
    if (taskFilterCat && taskFilterCat !== 'all') filtered = filtered.filter(t => t.category === taskFilterCat);
    if (taskFilterPri && taskFilterPri !== 'all') filtered = filtered.filter(t => t.priority === parseInt(taskFilterPri));
    if (taskFilterStatus && taskFilterStatus !== 'all') {
      if (taskFilterStatus === 'pending') filtered = filtered.filter(t => t.status !== 'done');
      else filtered = filtered.filter(t => t.status === taskFilterStatus);
    }

    filtered.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return a.priority - b.priority;
    });

    const cats = AgendaData.getCategories();
    let html = `<div class="view"><div class="view-header">
      <div class="view-title">✅ Tareas</div>
      <div class="view-actions">
        <select id="taskFilterCat" onchange="App.setTaskFilter('cat', this.value)" style="width:auto;">
          <option value="all">Todas las categorías</option>
          ${cats.map(c => `<option value="${c.id}" ${state.taskFilterCat === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}
        </select>
        <select id="taskFilterPri" onchange="App.setTaskFilter('pri', this.value)" style="width:auto;">
          <option value="all">Todas las prioridades</option>
          <option value="1" ${state.taskFilterPri === '1' ? 'selected' : ''}>P1 - Urgente</option>
          <option value="2" ${state.taskFilterPri === '2' ? 'selected' : ''}>P2 - Importante</option>
          <option value="3" ${state.taskFilterPri === '3' ? 'selected' : ''}>P3 - Normal</option>
          <option value="4" ${state.taskFilterPri === '4' ? 'selected' : ''}>P4 - Baja</option>
        </select>
        <select id="taskFilterStatus" onchange="App.setTaskFilter('status', this.value)" style="width:auto;">
          <option value="all">Todos los estados</option>
          <option value="pending" ${state.taskFilterStatus === 'pending' ? 'selected' : ''}>Pendientes</option>
          <option value="done" ${state.taskFilterStatus === 'done' ? 'selected' : ''}>Completadas</option>
        </select>
        <button class="btn-primary" onclick="App.openTaskForm()">+ Nueva tarea</button>
      </div>
    </div><div class="tasks-list">`;

    if (filtered.length === 0) {
      html += `<div style="color:var(--text-muted);text-align:center;padding:40px;">No hay tareas con estos filtros</div>`;
    }
    filtered.forEach(t => {
      const cat = cats.find(c => c.id === t.category);
      html += `<div class="task-item priority-p${t.priority} ${t.status === 'done' ? 'done' : ''}" data-id="${t.id}">
        <div class="check-anim ${t.status === 'done' ? 'checked' : ''}" onclick="App.toggleTaskItem('${t.id}')" style="cursor:pointer;">
          <svg viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,3.5"/></svg>
        </div>
        <div class="task-info" onclick="App.openTaskForm('${t.id}')">
          <div class="task-title">${this._esc(t.title)}</div>
          <div class="task-meta">
            ${cat ? `<span>${cat.icon} ${cat.label}</span>` : ''}
            ${t.dueDate ? `<span>📅 ${this._formatDateShort(t.dueDate)}</span>` : ''}
          </div>
        </div>
        <span class="badge badge-p${t.priority}">${PRIORITIES[t.priority]}</span>
        <div class="task-actions">
          <button class="btn-secondary btn-sm" onclick="event.stopPropagation();App.openTaskForm('${t.id}')">✏️</button>
          <button class="btn-danger btn-sm" onclick="event.stopPropagation();App.deleteTaskItem('${t.id}')">🗑️</button>
        </div>
      </div>`;
    });
    html += `</div></div>`;
    return html;
  },

  renderHabits(state) {
    const habits = AgendaData.getHabits();
    const today = new Date();
    const days = [];
    for (let i = 30; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const todayStr = this._toDateStr(today);

    let html = `<div class="view"><div class="view-header">
      <div class="view-title">🔄 Hábitos</div>
      <div class="view-actions">
        <button class="btn-primary" onclick="App.openHabitForm()">+ Nuevo hábito</button>
      </div>
    </div>`;

    if (habits.length === 0) {
      html += `<div style="color:var(--text-muted);text-align:center;padding:40px;">No hay hábitos. ¡Crea tu primer hábito!</div></div>`;
      return html;
    }

    html += `<div class="habits-table-wrap"><table class="habits-table"><thead><tr><th style="text-align:left;min-width:140px;">Hábito</th>
      ${days.map(d => {
        const isToday = this._toDateStr(d) === todayStr;
        return `<th style="font-weight:${isToday ? '700' : '500'};color:${isToday ? 'var(--accent-1)' : 'var(--text-muted)'};">${d.getDate()}</th>`;
      }).join('')}
      <th style="color:var(--text-muted);">🔥</th>
    </tr></thead><tbody>`;

    habits.forEach(h => {
      const streak = h.streak || 0;
      html += `<tr><td class="habit-name">
        <span style="display:flex;align-items:center;gap:8px;">
          <span>${this._esc(h.name)}</span>
          ${streak > 0 ? `<span class="streak-pill">🔥 ${streak}</span>` : ''}
        </span>
      </td>`;
      days.forEach(d => {
        const dStr = this._toDateStr(d);
        const done = h.logs && h.logs[dStr];
        const isToday = dStr === todayStr;
        html += `<td><div class="habit-cell ${done ? 'done' : ''} ${isToday ? 'today' : ''}" onclick="App.toggleHabitItem('${h.id}','${dStr}')"></div></td>`;
      });
      html += `<td style="text-align:center;font-size:0.78rem;color:var(--text-muted);">${h.frequency === 'weekly' ? '📅' : '🔄'}</td>`;
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    html += `<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">`;
    habits.forEach(h => {
      html += `<button class="btn-secondary btn-sm" onclick="App.openHabitForm('${h.id}')">✏️ ${this._esc(h.name)}</button>`;
    });
    html += `</div></div>`;
    return html;
  },

  renderNotes(state) {
    const notes = AgendaData.getNotes();
    const query = state.notesQuery || '';
    const filtered = query ? AgendaData.searchNotes(query) : notes;
    filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    let html = `<div class="view"><div class="view-header">
      <div class="view-title">📝 Notas</div>
      <div class="view-actions">
        <input type="text" placeholder="Buscar notas..." value="${this._esc(query)}" oninput="App.setNotesQuery(this.value)" style="width:200px;">
        <button class="btn-primary" onclick="App.openNoteForm()">+ Nueva nota</button>
      </div>
    </div><div class="notes-grid">`;

    if (filtered.length === 0) {
      html += `<div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">${query ? 'Sin resultados' : 'No hay notas. ¡Crea tu primera nota!'}</div>`;
    }
    filtered.forEach(n => {
      const hash = n.title ? n.title.length + (n.content ? n.content.length : 0) : 0;
      const colors = ['#6C63FF','#00D4FF','#FF6B9D','#2ECC71','#FFA46C','#CE93D8'];
      const accent = colors[hash % colors.length];
      html += `<div class="note-card" style="border-left:3px solid ${accent};" onclick="App.openNoteForm('${n.id}')">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span class="note-date">${n.date ? this._formatDateShort(n.date) : ''}</span>
          ${n.tags && n.tags.length ? n.tags.slice(0, 2).map(t => `<span class="tag">${this._esc(t)}</span>`).join('') : ''}
        </div>
        <div class="note-title">${this._esc(n.title || 'Sin título')}</div>
        ${n.content ? `<div class="note-preview">${this._esc(n.content)}</div>` : ''}
      </div>`;
    });
    html += `</div></div>`;
    return html;
  },

  // ---------- Modal forms ----------

  showModal(title, bodyHtml, footerHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML = footerHtml || '';
    document.getElementById('modal').classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('modal').classList.add('hidden');
  },

  showConfirm(body, onConfirm) {
    document.getElementById('confirmBody').innerHTML = body;
    document.getElementById('confirmFooter').innerHTML = `
      <button class="btn-secondary" onclick="UI.hideConfirm()">Cancelar</button>
      <button class="btn-danger" id="confirmOkBtn">Eliminar</button>`;
    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmOkBtn').onclick = () => {
      this.hideConfirm();
      onConfirm();
    };
  },

  hideConfirm() {
    document.getElementById('confirmModal').classList.add('hidden');
  },

  openTripForm(tripId) {
    this._currentTripId = tripId || null;
    const t = tripId ? AgendaData.getDreamTrips().find(t => t.id === tripId) : null;
    const isEdit = !!t;
    const statusOptions = [
      { value: 'dreaming', label: '💜 Soñando' },
      { value: 'planning', label: '🔵 Planeando' },
      { value: 'saving', label: '🟡 Ahorrando' },
      { value: 'booked', label: '🟢 Reservado' },
      { value: 'done', label: '✅ Hecho' },
    ];
    const emojis = ['🌍','🌎','🌏','🗺️','🏝️','🏔️','🌋','🏰','🗼','🌉','🏛️','🕌','🕍','🎡','🏖️','🌴','❄️','🏯','⛩️','🛕'];

    const images = (t && t.images) || [];
    const bucketItems = (t && t.bucketList) || [];

    let heroImgHtml = '';
    if (isEdit) {
      heroImgHtml = `<div class="trip-hero" style="background-image:url('${images.length > 0 ? this._esc(images[0]) : ''}')">
        <div class="trip-hero-overlay"></div>
        <div class="trip-hero-content">
          ${t.emoji ? `<span class="trip-emoji">${t.emoji}</span>` : ''}
          <div class="trip-name" style="color:#fff;">${this._esc(t.destination || '')}</div>
          <div class="trip-country" style="color:rgba(255,255,255,0.6);">${this._esc(t.country || '')}</div>
        </div>
      </div>`;

      // Gallery
      let galleryHtml = `<div class="trip-gallery">`;
      images.forEach((img, i) => {
        galleryHtml += `<img class="trip-gallery-img ${i === 0 ? 'active' : ''}" src="${this._esc(img)}" onclick="document.getElementById('tripHero').style.backgroundImage='url(${this._esc(img)})';document.querySelectorAll('.trip-gallery-img').forEach(e=>e.classList.remove('active'));this.classList.add('active')">`;
      });
      galleryHtml += `<div class="trip-gallery-add" onclick="document.getElementById('tripPhotoInput').click()">+</div>`;
      galleryHtml += `</div>`;

      heroImgHtml += galleryHtml;
    }

    // Bucket list
    let bucketHtml = '';
    if (isEdit && bucketItems.length > 0) {
      bucketHtml += `<div class="trip-section"><div class="trip-section-title">📋 Bucket list</div>`;
      bucketItems.forEach((item, i) => {
        bucketHtml += `<div class="bucket-item ${item.done ? 'done' : ''}" onclick="App.toggleBucketItem('${t.id}', ${i})">
          <span class="bucket-check ${item.done ? 'checked' : ''}">${item.done ? '✓' : ''}</span>
          ${this._esc(item.title)}
        </div>`;
      });
      bucketHtml += `</div>`;
    }

    const body = `
      ${isEdit ? heroImgHtml : ''}
      ${this._formField('Destino', `<input class="form-control" id="tripDest" value="${this._esc(t ? t.destination : '')}" placeholder="Ej: París" autofocus>`)}
      <div class="form-row">
        ${this._formField('País', `<input class="form-control" id="tripCountry" value="${this._esc(t ? t.country : '')}" placeholder="Ej: Francia">`)}
        ${this._formField('Estado', this._select(statusOptions, t ? t.status : 'dreaming', 'class="form-control" id="tripStatus"'))}
      </div>
      <div class="form-row">
        ${this._formField('Emoji / Bandera', `<select class="form-control" id="tripEmoji">${emojis.map(e => `<option value="${e}" ${t && t.emoji === e ? 'selected' : ''}>${e}</option>`).join('')}</select>`)}
        ${this._formField('Inspiración', `<input class="form-control" id="tripInspo" value="${this._esc(t ? t.inspiration || '' : '')}" placeholder="Link o nota de inspiración">`)}
      </div>
      ${this._formField('Notas / Por qué quiero ir', `<textarea class="form-control" id="tripNotes" rows="2">${t ? this._esc(t.notes || '') : ''}</textarea>`)}
      ${!isEdit ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px;">✏️ Después de crear el viaje podés subir fotos y agregar tu bucket list.</div>` : ''}
      <input type="file" id="tripPhotoInput" accept="image/*" style="display:none" onchange="App.addTripPhoto(event)">
      ${isEdit ? `
        <div class="trip-section"><div class="trip-section-title">📋 Bucket list</div>
        <div id="bucketListContainer">${bucketHtml || '<div style="color:var(--text-muted);font-size:0.85rem;">Sin items todavía. Agregá cosas que querés hacer allí.</div>'}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input class="form-control" id="newBucketItem" placeholder="Ej: Subir a la Torre Eiffel" style="flex:1;" onkeydown="if(event.key==='Enter')App.addBucketItem('${t.id}')">
          <button class="btn-primary btn-sm" onclick="App.addBucketItem('${t.id}')">+</button>
        </div></div>
      ` : ''}
    `;

    const footer = `
      ${isEdit ? `<button class="btn-danger" onclick="App.deleteTripItem('${t.id}')">Eliminar</button>` : ''}
      <button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
      <button class="btn-primary" onclick="App.saveTripForm('${t ? t.id : ''}')">${isEdit ? 'Guardar' : 'Crear viaje'}</button>
    `;

    this.showModal(isEdit ? '✈️ Editar viaje' : '✈️ Nuevo viaje soñado', body, footer);
    if (!isEdit) setTimeout(() => document.getElementById('tripDest')?.focus(), 100);
  },

  _formField(label, html, cls = '') {
    return `<div class="form-group ${cls}"><label>${label}</label>${html}</div>`;
  },

  _select(options, value, attrs = '') {
    return `<select ${attrs}>${options.map(o => `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`).join('')}</select>`;
  },

  openEventForm(dateStr, hour, eventId, isOverride) {
    const ev = eventId ? AgendaData.getEvents().find(e => e.id === eventId) : null;
    const cats = AgendaData.getCategories();
    const isEdit = !!ev;
    const isRecurringEvent = ev && AgendaData.isRecurring(ev);

    const recOptions = [
      { value: 'none', label: 'No repetir' },
      { value: 'daily', label: 'Todos los días' },
      { value: 'weekdays', label: 'Lun-Vie (entre semana)' },
      { value: 'weekends', label: 'Sáb-Dom (fin de semana)' },
      { value: 'weekly', label: 'Semanal (mismo día)' },
      { value: 'custom', label: 'Personalizado (elegir días)' },
    ];

    const body = `
      ${this._formField('Título', `<input class="form-control" id="evTitle" value="${this._esc(ev ? ev.title : '')}" placeholder="¿Qué vas a hacer?" autofocus>`)}
      <div class="form-row">
        ${this._formField('Fecha', `<input class="form-control" type="date" id="evDate" value="${ev ? ev.date : dateStr}">`)}
        ${this._formField('Hora inicio', `<input class="form-control" type="time" id="evStart" value="${ev ? ev.startTime : (hour !== undefined ? String(hour).padStart(2, '0') + ':00' : '09:00')}">`)}
      </div>
      <div class="form-row">
        ${this._formField('Hora fin', `<input class="form-control" type="time" id="evEnd" value="${ev && ev.endTime ? ev.endTime : ''}">`)}
        ${this._formField('Categoría', this._select(cats.map(c => ({ value: c.id, label: c.icon + ' ' + c.label })), ev ? ev.category : 'trabajo', 'class="form-control" id="evCategory"'))}
      </div>
      <div class="form-row">
        ${this._formField('Prioridad', this._select([1,2,3,4].map(p => ({ value: p, label: PRIORITIES[p] })), ev ? ev.priority : 3, 'class="form-control" id="evPriority"'))}
        ${this._formField('Repite', this._select(recOptions, ev ? ev.recurrence : 'none', 'class="form-control" id="evRecurrence" onchange="UI.toggleCustomDays()"'))}
      </div>
      <div id="evCustomDays" style="display:${ev && ev.recurrence === 'custom' ? 'block' : 'none'};margin-bottom:14px;">
        <label style="font-size:0.8rem;color:#888;display:block;margin-bottom:6px;">Días de la semana</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d, i) => `
            <label style="display:flex;flex-direction:column;align-items:center;font-size:0.75rem;color:#aaa;cursor:pointer;gap:2px;">
              <input type="checkbox" value="${i}" ${ev && ev.recurrenceDays && ev.recurrenceDays.includes(i) ? 'checked' : ''} class="custom-day-cb" style="width:16px;height:16px;cursor:pointer;">
              ${d}
            </label>
          `).join('')}
        </div>
      </div>
      ${this._formField('Completado', `<input type="checkbox" id="evCompleted" ${ev && ev.completed ? 'checked' : ''} style="width:18px;height:18px;margin-top:4px;">`)}
      ${this._formField('Notas', `<textarea class="form-control" id="evNotes" rows="2">${ev ? this._esc(ev.notes || '') : ''}</textarea>`)}
      ${isOverride ? '<input type="hidden" id="evIsOverride" value="1">' : ''}
    `;

    let footer = `<button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
      <button class="btn-primary" onclick="App.saveEventForm('${eventId || ''}')">${isEdit && !isRecurringEvent ? 'Guardar' : isOverride ? 'Guardar' : 'Crear evento'}</button>`;

    if (isEdit && isRecurringEvent && !isOverride) {
      footer = `
        <button class="btn-danger" onclick="App.deleteEventItem('${eventId}')">Eliminar todas</button>
        <button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
        <button class="btn-secondary" onclick="App.editSingleOccurrence('${eventId}','${dateStr}')">Editar solo esta</button>
        <button class="btn-primary" onclick="App.saveEventForm('${eventId}')">Guardar todas</button>`;
    }

    this.showModal(isEdit ? 'Editar evento' : 'Nuevo evento', body, footer);
  },

  toggleCustomDays() {
    const sel = document.getElementById('evRecurrence');
    const custom = document.getElementById('evCustomDays');
    if (sel && custom) {
      custom.style.display = sel.value === 'custom' ? 'block' : 'none';
    }
  },

  openTaskForm(taskId) {
    const t = taskId ? AgendaData.getTasks().find(t => t.id === taskId) : null;
    const cats = AgendaData.getCategories();
    const isEdit = !!t;
    const today = this._toDateStr(new Date());

    const body = `
      ${this._formField('Título', `<input class="form-control" id="taskTitle" value="${this._esc(t ? t.title : '')}" placeholder="¿Qué hay que hacer?" autofocus>`)}
      <div class="form-row">
        ${this._formField('Fecha límite', `<input class="form-control" type="date" id="taskDue" value="${t ? t.dueDate : ''}">`)}
        ${this._formField('Categoría', this._select(cats.map(c => ({ value: c.id, label: c.icon + ' ' + c.label })), t ? t.category : 'trabajo', 'class="form-control" id="taskCategory"'))}
      </div>
      <div class="form-row">
        ${this._formField('Prioridad', this._select([1,2,3,4].map(p => ({ value: p, label: PRIORITIES[p] })), t ? t.priority : 3, 'class="form-control" id="taskPriority"'))}
        ${this._formField('Estado', this._select([
          { value: 'pending', label: 'Pendiente' },
          { value: 'in_progress', label: 'En progreso' },
          { value: 'done', label: 'Completada' },
        ], t ? t.status : 'pending', 'class="form-control" id="taskStatus"'))}
      </div>
      ${this._formField('Notas', `<textarea class="form-control" id="taskNotes" rows="2">${t ? this._esc(t.notes || '') : ''}</textarea>`)}
    `;

    const footer = `
      ${isEdit ? `<button class="btn-danger" onclick="App.deleteTaskItem('${taskId}')">Eliminar</button>` : ''}
      <button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
      <button class="btn-primary" onclick="App.saveTaskForm('${taskId || ''}')">${isEdit ? 'Guardar' : 'Crear tarea'}</button>
    `;

    this.showModal(isEdit ? 'Editar tarea' : 'Nueva tarea', body, footer);
  },

  openGoalForm(goalId) {
    const g = goalId ? AgendaData.getGoals().find(g => g.id === goalId) : null;
    const cats = AgendaData.getCategories();
    const isEdit = !!g;

    const body = `
      ${this._formField('Título', `<input class="form-control" id="goalTitle" value="${this._esc(g ? g.title : '')}" placeholder="Nombre de la meta" autofocus>`)}
      ${this._formField('Descripción', `<textarea class="form-control" id="goalDesc" rows="2">${g ? this._esc(g.description || '') : ''}</textarea>`)}
      <div class="form-row">
        ${this._formField('Periodo', this._select([
          { value: 'yearly', label: 'Anual' },
          { value: 'quarterly', label: 'Trimestral' },
          { value: 'monthly', label: 'Mensual' },
          { value: 'weekly', label: 'Semanal' },
        ], g ? g.timeframe : 'monthly', 'class="form-control" id="goalTimeframe"'))}
        ${this._formField('Categoría', this._select(cats.map(c => ({ value: c.id, label: c.icon + ' ' + c.label })), g ? g.category : 'personal', 'class="form-control" id="goalCategory"'))}
      </div>
      ${this._formField('Fecha objetivo', `<input class="form-control" type="date" id="goalTarget" value="${g && g.targetDate ? g.targetDate : ''}">`)}
      ${this._formField('Progreso (%)', `<input class="form-control" type="number" id="goalProgress" min="0" max="100" value="${g ? g.progress : 0}">`)}
      ${this._formField('Hitos (uno por línea)', `<textarea class="form-control" id="goalMilestones" rows="3" placeholder="Ej: Investigar&#10;Diseñar&#10;Implementar">${g && g.milestones ? g.milestones.map(m => m.title).join('\n') : ''}</textarea>`)}
    `;

    const footer = `
      ${isEdit ? `<button class="btn-danger" onclick="App.deleteGoalItem('${goalId}')">Eliminar</button>` : ''}
      <button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
      <button class="btn-primary" onclick="App.saveGoalForm('${goalId || ''}')">${isEdit ? 'Guardar' : 'Crear meta'}</button>
    `;

    this.showModal(isEdit ? 'Editar meta' : 'Nueva meta', body, footer);
  },

  openHabitForm(habitId) {
    const h = habitId ? AgendaData.getHabits().find(h => h.id === habitId) : null;
    const cats = AgendaData.getCategories();
    const isEdit = !!h;

    const body = `
      ${this._formField('Nombre', `<input class="form-control" id="habitName" value="${this._esc(h ? h.name : '')}" placeholder="Ej: Meditar, Leer, Ejercicio" autofocus>`)}
      ${this._formField('Descripción', `<input class="form-control" id="habitDesc" value="${this._esc(h ? h.description || '' : '')}" placeholder="Opcional">`)}
      <div class="form-row">
        ${this._formField('Categoría', this._select(cats.map(c => ({ value: c.id, label: c.icon + ' ' + c.label })), h ? h.category : 'salud', 'class="form-control" id="habitCategory"'))}
        ${this._formField('Frecuencia', this._select([
          { value: 'daily', label: 'Diario' },
          { value: 'weekly', label: 'Semanal' },
        ], h ? h.frequency : 'daily', 'class="form-control" id="habitFrequency"'))}
      </div>
    `;

    const footer = `
      ${isEdit ? `<button class="btn-danger" onclick="App.deleteHabitItem('${habitId}')">Eliminar</button>` : ''}
      <button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
      <button class="btn-primary" onclick="App.saveHabitForm('${habitId || ''}')">${isEdit ? 'Guardar' : 'Crear hábito'}</button>
    `;

    this.showModal(isEdit ? 'Editar hábito' : 'Nuevo hábito', body, footer);
  },

  openNoteForm(noteId) {
    const n = noteId ? AgendaData.getNotes().find(n => n.id === noteId) : null;
    const isEdit = !!n;
    const today = this._toDateStr(new Date());

    const body = `
      ${this._formField('Título', `<input class="form-control" id="noteTitle" value="${this._esc(n ? n.title : '')}" placeholder="Título de la nota" autofocus>`)}
      ${this._formField('Fecha', `<input class="form-control" type="date" id="noteDate" value="${n ? n.date : today}">`)}
      ${this._formField('Contenido', `<textarea class="form-control" id="noteContent" rows="6" placeholder="Escribe tu nota aquí...">${n ? this._esc(n.content || '') : ''}</textarea>`)}
      ${this._formField('Tags (separados por coma)', `<input class="form-control" id="noteTags" value="${n && n.tags ? n.tags.join(', ') : ''}" placeholder="Ej: idea, proyecto, personal">`)}
    `;

    const footer = `
      ${isEdit ? `<button class="btn-danger" onclick="App.deleteNoteItem('${noteId}')">Eliminar</button>` : ''}
      <button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
      <button class="btn-primary" onclick="App.saveNoteForm('${noteId || ''}')">${isEdit ? 'Guardar' : 'Crear nota'}</button>
    `;

    this.showModal(isEdit ? 'Editar nota' : 'Nueva nota', body, footer);
  },

  openGymForm(routineId) {
    const r = routineId ? AgendaData.getGymRoutines().find(r => r.id === routineId) : null;
    const isEdit = !!r;
    const today = this._toDateStr(new Date());
    const hist = AgendaData.getGymExerciseHistory();
    const restOptions = [0.5, 1, 1.5, 2, 3, 5].map(v => ({ value: v, label: v >= 1 ? v + ' min' : '30s' }));

    let exercisesHtml = '';
    const exercises = (r && r.exercises) || [];

    if (exercises.length === 0 && !isEdit) {
      // New routine: start with one empty exercise
      exercisesHtml = this._gymExerciseHtml(null, 0, hist, restOptions);
    } else {
      exercises.forEach((ex, i) => {
        exercisesHtml += this._gymExerciseHtml(ex, i, hist, restOptions);
      });
    }

    const totalVolume = exercises.reduce((sum, ex) =>
      sum + (ex.sets || []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0);

    const body = `
      <div class="form-row">
        ${this._formField('Nombre', `<input class="form-control" id="gymName" value="${this._esc(r ? r.name : '')}" placeholder="Ej: Push Day" autofocus>`)}
        ${this._formField('Fecha', `<input class="form-control" type="date" id="gymDate" value="${r ? r.date : today}">`)}
      </div>
      <div class="section-title" style="margin-top:4px;">🏋️ Ejercicios</div>
      <div id="gymExercises">${exercisesHtml}</div>
      <button class="btn-secondary btn-sm" onclick="App.addGymExercise()" style="width:100%;margin-top:4px;">+ Agregar ejercicio</button>
      ${isEdit ? `<div class="gym-volume" id="gymVolume">🏋️ Volumen total: <strong>${totalVolume.toLocaleString()} kg</strong></div>` : ''}
      <input type="hidden" id="gymIsEdit" value="${isEdit ? '1' : '0'}">
    `;

    const footer = `
      ${isEdit ? `<button class="btn-danger" onclick="App.deleteGymItem('${routineId}')">Eliminar</button>` : ''}
      <button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
      <button class="btn-primary" onclick="App.saveGymForm('${routineId || ''}')">${isEdit ? 'Guardar' : 'Crear entrenamiento'}</button>
    `;

    this.showModal(isEdit ? '🏋️ Editar entrenamiento' : '🏋️ Nuevo entrenamiento', body, footer);
    if (!isEdit) setTimeout(() => document.getElementById('gymName')?.focus(), 100);
  },

  _gymExerciseHtml(ex, idx, hist, restOptions) {
    const name = ex ? ex.name : '';
    const sets = (ex && ex.sets) || [{ weight: '', reps: '', rest: 1.5, done: false }];
    const notes = ex ? (ex.notes || '') : '';

    const histKey = name ? hist[name] : null;
    const prefillWeight = histKey ? histKey.lastWeight : '';

    let setsHtml = `<div style="display:grid;grid-template-columns:60px 60px 80px 36px 20px;gap:8px;align-items:center;margin-bottom:4px;">
      <span class="gym-set-label">Peso</span>
      <span class="gym-set-label">Reps</span>
      <span class="gym-set-label">Descanso</span>
      <span class="gym-set-label" style="text-align:center;">✓</span>
      <span></span>
    </div>`;

    sets.forEach((set, si) => {
      const w = set.weight != null ? set.weight : (si === 0 && prefillWeight ? prefillWeight : '');
      const rp = set.reps != null ? set.reps : (si === 0 && histKey ? histKey.lastReps : '');
      setsHtml += this._gymSetHtml(idx, si, w, rp, set.rest || 1.5, set.done, restOptions);
    });

    return `<div class="gym-exercise" data-ex-idx="${idx}">
      <div class="gym-exercise-header">
        <input class="form-control gym-exercise-name" id="gymExName_${idx}" value="${this._esc(name)}" placeholder="Nombre del ejercicio" oninput="App.onGymExerciseNameChange(${idx})">
        <button class="btn-danger btn-sm" onclick="App.removeGymExercise(${idx})" style="padding:4px 8px;font-size:0.7rem;">✕</button>
      </div>
      <div id="gymSets_${idx}">${setsHtml}</div>
      <div style="display:flex;gap:10px;align-items:center;margin-top:6px;">
        <span class="gym-add-set" onclick="App.addGymSet(${idx})">+ Serie</span>
        <input class="form-control" id="gymExNotes_${idx}" value="${this._esc(notes)}" placeholder="Notas (opcional)" style="flex:1;font-size:0.78rem;padding:4px 8px;">
      </div>
    </div>`;
  },

  _gymSetHtml(exIdx, setIdx, weight, reps, rest, done, restOptions) {
    const checked = done ? 'checked' : '';
    return `<div class="gym-set-row" data-set-idx="${setIdx}">
      <input class="gym-set-input" type="number" min="0" step="2.5" id="gymWeight_${exIdx}_${setIdx}" value="${weight != null ? weight : ''}" placeholder="kg" oninput="App.onGymSetChange()">
      <input class="gym-set-input" type="number" min="0" step="1" id="gymReps_${exIdx}_${setIdx}" value="${reps != null ? reps : ''}" placeholder="reps" oninput="App.onGymSetChange()">
      <select class="gym-set-input gym-set-input-sm" id="gymRest_${exIdx}_${setIdx}" oninput="App.onGymSetChange()">
        ${restOptions.map(o => `<option value="${o.value}" ${rest == o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
      </select>
      <div class="gym-set-check ${checked}" id="gymDone_${exIdx}_${setIdx}" onclick="this.classList.toggle('checked');App.onGymSetChange()">${checked ? '✓' : ''}</div>
      <span class="gym-remove-set" onclick="App.removeGymSet(${exIdx}, ${setIdx})">✕</span>
    </div>`;
  },

  openSettings() {
    const s = AgendaData.getSettings();
    const cats = AgendaData.getCategories();

    let body = `<h4 style="color:#fff;margin-bottom:12px;">⏰ Horario</h4>
      <div class="form-row">
        ${this._formField('Inicio jornada', `<input class="form-control" type="number" id="setWorkStart" min="0" max="23" value="${s.workStartHour}">`)}
        ${this._formField('Fin jornada', `<input class="form-control" type="number" id="setWorkEnd" min="0" max="23" value="${s.workEndHour}">`)}
      </div>
      <div style="font-size:0.8rem;color:#888;margin-bottom:14px;padding:8px 12px;background:#1a1a34;border-radius:8px;">Vista horaria: 00:00 a 23:00 (24h fijo)</div>
      <h4 style="color:#fff;margin:16px 0 12px;">📁 Categorías</h4>
      <div style="display:flex;flex-direction:column;gap:6px;">`;

    cats.forEach(c => {
      body += `<div style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
        <span>${c.icon}</span>
        <input type="color" value="${c.color}" onchange="App.updateCatColor('${c.id}', this.value)" style="width:32px;height:32px;padding:0;border:none;background:none;">
        <span style="color:#fff;flex:1;">${c.label}</span>
      </div>`;
    });

    body += `</div>
      <h4 style="color:#fff;margin:16px 0 12px;">💾 Datos</h4>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn-secondary btn-sm" onclick="App.exportData()">📤 Exportar</button>
        <button class="btn-secondary btn-sm" onclick="App.importData()">📥 Importar</button>
        <button class="btn-danger btn-sm" onclick="App.clearAllData()">🗑️ Limpiar todo</button>
      </div>`;

    const footer = `
      <button class="btn-secondary" onclick="UI.hideModal()">Cancelar</button>
      <button class="btn-primary" onclick="App.saveSettings()">Guardar</button>
    `;

    this.showModal('⚙️ Configuración', body, footer);
  },
};
