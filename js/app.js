const App = {
  state: {
    currentView: 'today',
    currentDate: new Date(),
    goalFilter: 'all',
    taskFilterCat: 'all',
    taskFilterPri: 'all',
    taskFilterStatus: 'all',
    notesQuery: '',
  },

  init() {
    this.applyTheme();
    this.updateHeaderDate();
    this.renderView('today');

    // Nav clicks
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.view;
        if (v === '__more__') { this.toggleMoreMenu(); return; }
        this.switchView(v);
      });
    });

    // Nav controls
    document.getElementById('prevBtn').addEventListener('click', () => this.navigate(-1));
    document.getElementById('nextBtn').addEventListener('click', () => this.navigate(1));
    document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => UI.openSettings());

    // Modal close
    document.querySelectorAll('.modal-close').forEach(el => {
      el.addEventListener('click', () => {
        UI.hideModal();
        UI.hideConfirm();
      });
    });
    document.querySelectorAll('.modal-backdrop').forEach(el => {
      el.addEventListener('click', () => {
        UI.hideModal();
        UI.hideConfirm();
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UI.hideModal();
        UI.hideConfirm();
      }
    });

    // Touch swipe support
    let touchStartX = 0, touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) this.navigate(1);
        else this.navigate(-1);
      }
    }, { passive: true });

    // FAB visibility on scroll (hide on scroll down, show on scroll up)
    let lastScrollY = 0;
    document.addEventListener('scroll', () => {
      const fab = document.getElementById('fab');
      if (!fab || fab.classList.contains('hidden')) return;
      const sy = window.scrollY;
      fab.classList.toggle('fab-hidden', sy > lastScrollY && sy > 80);
      lastScrollY = sy;
    }, { passive: true });

    // Ripple effect on buttons
    document.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      btn.style.setProperty('--ripple-x', x + '%');
      btn.style.setProperty('--ripple-y', y + '%');
    });
  },

  // ---------- Navigation ----------
  switchView(view) {
    this.state.currentView = view;
    document.querySelectorAll('.nav-btn').forEach(b => {
      const isActive = b.dataset.view === view;
      b.classList.toggle('active', isActive);
      // If secondary view is active and button is hidden, clear others
      if (isActive && b.classList.contains('nav-secondary')) {
        document.querySelectorAll('.nav-btn:not(.nav-secondary)').forEach(x => x.classList.remove('active'));
      }
    });
    this.renderView(view);
  },

  renderView(view) {
    const container = document.getElementById('mainContent');
    switch (view) {
      case 'today': container.innerHTML = UI.renderToday(this.state); break;
      case 'daily': container.innerHTML = UI.renderDaily(this.state); break;
      case 'weekly': container.innerHTML = UI.renderWeekly(this.state); break;
      case 'monthly': container.innerHTML = UI.renderMonthly(this.state); break;
      case 'goals': container.innerHTML = UI.renderGoals(this.state); break;
      case 'trips': container.innerHTML = UI.renderTrips(this.state); break;
      case 'gym': container.innerHTML = UI.renderGym(this.state); break;
      case 'tasks': container.innerHTML = UI.renderTasks(this.state); break;
      case 'habits': container.innerHTML = UI.renderHabits(this.state); break;
      case 'notes': container.innerHTML = UI.renderNotes(this.state); break;
    }
    this._postRender(view, container);
    this.updateNavTitle();
    if (['today', 'daily'].includes(view)) this.updateHeaderDate();
  },

  _postRender(view, container) {
    // Close more menu if open
    this.hideMoreMenu();
    // Add btn class to buttons
    container.querySelectorAll('.btn-primary, .btn-secondary, .btn-danger').forEach(el => el.classList.add('btn'));
    // Stagger grids
    const grids = container.querySelectorAll('.today-grid, .week-grid, .goals-grid, .trips-grid, .notes-grid, .tasks-list, .stats-row');
    grids.forEach(g => g.classList.add('stagger-children'));
    // FAB visibility
    this._updateFab(view);
    // Countup stats
    container.querySelectorAll('.stat-value').forEach(el => {
      const val = parseFloat(el.textContent);
      if (!isNaN(val) && val > 0) {
        el.classList.add('countup');
        el.dataset.target = val;
        el.textContent = '0';
        this._animateCount(el, val);
      }
    });
  },

  _animateCount(el, target) {
    const duration = 400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  updateNavTitle() {
    const d = this.state.currentDate;
    let title = '';
    switch (this.state.currentView) {
      case 'today': title = UI._formatDate(d); break;
      case 'daily': title = UI._formatDate(d); break;
      case 'weekly':
        const monday = new Date(d);
        monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        title = `${UI._formatDateShort(monday)} - ${UI._formatDateShort(sunday)}`;
        break;
      case 'monthly': title = `${MONTHS[d.getMonth()].charAt(0).toUpperCase() + MONTHS[d.getMonth()].slice(1)} ${d.getFullYear()}`; break;
      case 'goals': title = '🎯 Metas y Objetivos'; break;
      case 'trips': title = '✈️ Viajes Soñados'; break;
      case 'gym': title = '🏋️ Gimnasio'; break;
      case 'tasks': title = '✅ Tareas'; break;
      case 'habits': title = '🔄 Hábitos'; break;
      case 'notes': title = '📝 Notas'; break;
    }
    document.getElementById('navTitle').textContent = title;
  },

  updateHeaderDate() {
    const now = new Date();
    document.getElementById('headerDate').textContent = UI._formatDate(now);
  },

  navigate(dir) {
    const v = this.state.currentView;
    const d = new Date(this.state.currentDate);
    if (v === 'daily' || v === 'today') {
      d.setDate(d.getDate() + dir);
    } else if (v === 'weekly') {
      d.setDate(d.getDate() + dir * 7);
    } else if (v === 'monthly') {
      d.setMonth(d.getMonth() + dir);
    } else {
      return;
    }
    this.state.currentDate = d;
    this.renderView(v);
  },

  goToToday() {
    this.state.currentDate = new Date();
    this.renderView(this.state.currentView);
    if (this.state.currentView === 'today') {
      const now = new Date();
      document.getElementById('headerDate').textContent = UI._formatDate(now);
    }
  },

  _updateFab(view) {
    const fab = document.getElementById('fab');
    if (!fab) return;
    const createActions = {
      today: () => this.openEventForm(UI._toDateStr(this.state.currentDate)),
      daily: () => this.openEventForm(UI._toDateStr(this.state.currentDate)),
      weekly: () => this.openEventForm(UI._toDateStr(this.state.currentDate)),
      monthly: () => this.openEventForm(UI._toDateStr(this.state.currentDate)),
      goals: () => this.openGoalForm(),
      trips: () => this.openTripForm(),
      tasks: () => this.openTaskForm(),
      habits: () => this.openHabitForm(),
      gym: () => this.openGymForm(),
      notes: () => this.openNoteForm(),
    };
    if (createActions[view]) {
      fab._action = createActions[view];
      fab.classList.remove('hidden');
    } else {
      fab.classList.add('hidden');
    }
  },

  onFabClick() {
    const fab = document.getElementById('fab');
    if (fab && fab._action) fab._action();
  },

  // ---------- More menu (mobile) ----------
  _moreOpen: false,

  toggleMoreMenu() {
    if (this._moreOpen) this.hideMoreMenu();
    else this.showMoreMenu();
  },

  showMoreMenu() {
    if (this._moreOpen) return;
    this._moreOpen = true;
    const nav = document.getElementById('mainNav');
    const existing = nav.querySelector('.more-overlay');
    if (existing) existing.remove();

    const items = [
      { view: 'weekly', icon: '📆', label: 'Semanal' },
      { view: 'monthly', icon: '🗓️', label: 'Mensual' },
      { view: 'goals', icon: '🎯', label: 'Metas' },
      { view: 'trips', icon: '✈️', label: 'Viajes' },
      { view: 'habits', icon: '🔄', label: 'Hábitos' },
    ];
    const active = this.state.currentView;

    let html = '<div class="more-overlay" onclick="App.hideMoreMenu()"><div class="more-backdrop"></div><div class="more-grid" onclick="event.stopPropagation()">';
    items.forEach(item => {
      html += `<button class="more-item ${item.view === active ? 'active' : ''}" onclick="App.hideMoreMenu();App.switchView('${item.view}')">
        <span class="more-icon">${item.icon}</span>
        <span class="more-label">${item.label}</span>
      </button>`;
    });
    html += '</div></div>';
    nav.insertAdjacentHTML('beforeend', html);
    document.body.classList.add('more-open');
  },

  hideMoreMenu() {
    if (!this._moreOpen) return;
    this._moreOpen = false;
    const overlay = document.querySelector('.more-overlay');
    if (overlay) overlay.remove();
    document.body.classList.remove('more-open');
  },

  goToDate(dateStr) {
    this.state.currentDate = new Date(dateStr + 'T12:00:00');
    this.switchView('daily');
  },

  // ---------- Theme ----------
  applyTheme() {
    const theme = localStorage.getItem('agenda_theme') || 'dark';
    document.body.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  toggleTheme() {
    const current = localStorage.getItem('agenda_theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('agenda_theme', next);
    this.applyTheme();
    UI.toast(next === 'dark' ? '🌙 Tema oscuro' : '☀️ Tema claro');
  },

  // ---------- Filters ----------
  setGoalFilter(val) {
    this.state.goalFilter = val;
    this.renderView('goals');
  },

  setTaskFilter(type, val) {
    if (type === 'cat') this.state.taskFilterCat = val;
    else if (type === 'pri') this.state.taskFilterPri = val;
    else if (type === 'status') this.state.taskFilterStatus = val;
    this.renderView('tasks');
  },

  setNotesQuery(val) {
    this.state.notesQuery = val;
    this.renderView('notes');
  },

  // ---------- CRUD: Events ----------
  openEventForm(dateStr, hour, eventId) {
    UI.openEventForm(dateStr, hour, eventId, false);
    setTimeout(() => document.getElementById('evTitle')?.focus(), 100);
  },

  saveEventForm(eventId) {
    const title = document.getElementById('evTitle').value.trim();
    if (!title) { UI.toast('⚠️ El título es obligatorio'); return; }
    const isOverride = document.getElementById('evIsOverride');

    const cbDays = document.querySelectorAll('.custom-day-cb');
    const recurrenceDays = [];
    cbDays.forEach(cb => { if (cb.checked) recurrenceDays.push(parseInt(cb.value)); });

    const recurrence = document.getElementById('evRecurrence').value;
    if (recurrence === 'custom' && recurrenceDays.length === 0) {
      UI.toast('⚠️ Selecciona al menos un día para la repetición personalizada');
      return;
    }

    const data = {
      title,
      date: document.getElementById('evDate').value,
      startTime: document.getElementById('evStart').value,
      endTime: document.getElementById('evEnd').value,
      category: document.getElementById('evCategory').value,
      priority: parseInt(document.getElementById('evPriority').value),
      completed: document.getElementById('evCompleted').checked,
      notes: document.getElementById('evNotes').value.trim(),
      recurrence,
      recurrenceDays: recurrence === 'custom' ? recurrenceDays : undefined,
    };
    if (!data.date) { UI.toast('⚠️ La fecha es obligatoria'); return; }
    if (!data.startTime) { UI.toast('⚠️ La hora de inicio es obligatoria'); return; }

    if (eventId) {
      AgendaData.updateEvent(eventId, data);
      UI.toast('✅ Evento actualizado');
    } else {
      AgendaData.addEvent(data);
      UI.toast('✅ Evento creado');
    }
    UI.hideModal();
    this.renderView(this.state.currentView);
  },

  editSingleOccurrence(eventId, dateStr) {
    const ev = AgendaData.getEvents().find(e => e.id === eventId);
    if (!ev) return;
    const override = {
      ...ev,
      id: undefined,
      recurrence: 'none',
      recurrenceDays: undefined,
      exceptions: undefined,
      date: dateStr,
    };
    const newEv = AgendaData.addEvent(override);
    AgendaData.addException(eventId, dateStr);
    UI.hideModal();
    UI.openEventForm(dateStr, parseInt(ev.startTime), newEv.id, true);
    setTimeout(() => document.getElementById('evTitle')?.focus(), 100);
  },

  deleteEventItem(id) {
    const ev = AgendaData.getEvents().find(e => e.id === id);
    const isRecurring = ev && AgendaData.isRecurring(ev);

    if (isRecurring) {
      UI.showConfirm(
        `<p>¿Eliminar <strong>${UI._esc(ev.title)}</strong>?</p>
         <p style="color:#888;font-size:0.85rem;margin-top:8px;">Es un evento que se repite: ${AgendaData.getRecurrenceLabel(ev.recurrence, ev.recurrenceDays)}</p>`,
        () => {
          AgendaData.deleteEvent(id);
          UI.toast('🗑️ Evento eliminado');
          UI.hideModal();
          this.renderView(this.state.currentView);
        }
      );
    } else {
      UI.showConfirm('¿Eliminar este evento?', () => {
        AgendaData.deleteEvent(id);
        UI.toast('🗑️ Evento eliminado');
        UI.hideModal();
        this.renderView(this.state.currentView);
      });
    }
  },

  // ---------- CRUD: Tasks ----------
  openTaskForm(taskId) {
    UI.openTaskForm(taskId);
    setTimeout(() => document.getElementById('taskTitle')?.focus(), 100);
  },

  saveTaskForm(taskId) {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) { UI.toast('⚠️ El título es obligatorio'); return; }
    const data = {
      title,
      dueDate: document.getElementById('taskDue').value,
      category: document.getElementById('taskCategory').value,
      priority: parseInt(document.getElementById('taskPriority').value),
      status: document.getElementById('taskStatus').value,
      notes: document.getElementById('taskNotes').value.trim(),
    };
    if (taskId) {
      AgendaData.updateTask(taskId, data);
      UI.toast('✅ Tarea actualizada');
    } else {
      AgendaData.addTask(data);
      UI.toast('✅ Tarea creada');
    }
    UI.hideModal();
    this.renderView(this.state.currentView);
  },

  toggleTaskItem(id) {
    AgendaData.toggleTask(id);
    this.renderView(this.state.currentView);
  },

  deleteTaskItem(id) {
    UI.showConfirm('¿Eliminar esta tarea?', () => {
      AgendaData.deleteTask(id);
      UI.toast('🗑️ Tarea eliminada');
      this.renderView(this.state.currentView);
    });
  },

  // ---------- CRUD: Goals ----------
  openGoalForm(goalId) {
    UI.openGoalForm(goalId);
    setTimeout(() => document.getElementById('goalTitle')?.focus(), 100);
  },

  saveGoalForm(goalId) {
    const title = document.getElementById('goalTitle').value.trim();
    if (!title) { UI.toast('⚠️ El título es obligatorio'); return; }
    const milestonesRaw = document.getElementById('goalMilestones').value.trim();
    const milestones = milestonesRaw
      ? milestonesRaw.split('\n').filter(s => s.trim()).map(s => ({ title: s.trim(), done: false }))
      : [];

    const data = {
      title,
      description: document.getElementById('goalDesc').value.trim(),
      timeframe: document.getElementById('goalTimeframe').value,
      category: document.getElementById('goalCategory').value,
      targetDate: document.getElementById('goalTarget').value,
      progress: parseInt(document.getElementById('goalProgress').value) || 0,
      milestones,
    };

    if (goalId) {
      AgendaData.updateGoal(goalId, data);
      UI.toast('✅ Meta actualizada');
    } else {
      AgendaData.addGoal(data);
      UI.toast('✅ Meta creada');
    }
    UI.hideModal();
    this.renderView('goals');
  },

  toggleMilestoneItem(goalId, idx) {
    AgendaData.toggleMilestone(goalId, idx);
    this.renderView('goals');
  },

  deleteGoalItem(id) {
    UI.showConfirm('¿Eliminar esta meta?', () => {
      AgendaData.deleteGoal(id);
      UI.toast('🗑️ Meta eliminada');
      this.renderView('goals');
    });
  },

  // ---------- CRUD: Dream Trips ----------
  openTripForm(tripId) {
    UI.openTripForm(tripId);
  },

  saveTripForm(tripId) {
    const dest = document.getElementById('tripDest').value.trim();
    if (!dest) { UI.toast('⚠️ El destino es obligatorio'); return; }
    const data = {
      destination: dest,
      country: document.getElementById('tripCountry').value.trim(),
      status: document.getElementById('tripStatus').value,
      emoji: document.getElementById('tripEmoji').value,
      inspiration: document.getElementById('tripInspo').value.trim(),
      notes: document.getElementById('tripNotes').value.trim(),
    };
    if (tripId) {
      const existing = AgendaData.getDreamTrips().find(t => t.id === tripId);
      if (existing) {
        data.images = existing.images || [];
        data.bucketList = existing.bucketList || [];
      }
      AgendaData.updateDreamTrip(tripId, data);
      UI.toast('✅ Viaje actualizado');
    } else {
      AgendaData.addDreamTrip(data);
      UI.toast('✅ Viaje creado');
    }
    UI.hideModal();
    this.renderView('trips');
  },

  deleteTripItem(id) {
    UI.showConfirm('¿Eliminar este viaje soñado?', () => {
      AgendaData.deleteDreamTrip(id);
      UI.toast('🗑️ Viaje eliminado');
      UI.hideModal();
      this.renderView('trips');
    });
  },

  addBucketItem(tripId) {
    const input = document.getElementById('newBucketItem');
    const title = input.value.trim();
    if (!title) return;
    const trip = AgendaData.getDreamTrips().find(t => t.id === tripId);
    if (!trip) return;
    if (!trip.bucketList) trip.bucketList = [];
    trip.bucketList.push({ title, done: false });
    AgendaData.updateDreamTrip(tripId, { bucketList: trip.bucketList });
    input.value = '';
    UI.toast('✅ Item agregado');
    UI.openTripForm(tripId);
  },

  toggleBucketItem(tripId, idx) {
    AgendaData.toggleBucketItem(tripId, idx);
    UI.openTripForm(tripId);
  },

  addTripPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const tripId = UI._currentTripId;
    if (!tripId) { UI.toast('⚠️ Guardá el viaje primero'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const trip = AgendaData.getDreamTrips().find(t => t.id === tripId);
      if (!trip) return;
      if (!trip.images) trip.images = [];
      trip.images.push(e.target.result);
      AgendaData.updateDreamTrip(tripId, { images: trip.images });
      UI.openTripForm(tripId);
      UI.toast('✅ Foto agregada');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  },

  // ---------- CRUD: Habits ----------
  openHabitForm(habitId) {
    UI.openHabitForm(habitId);
    setTimeout(() => document.getElementById('habitName')?.focus(), 100);
  },

  saveHabitForm(habitId) {
    const name = document.getElementById('habitName').value.trim();
    if (!name) { UI.toast('⚠️ El nombre es obligatorio'); return; }
    const data = {
      name,
      description: document.getElementById('habitDesc').value.trim(),
      category: document.getElementById('habitCategory').value,
      frequency: document.getElementById('habitFrequency').value,
    };

    if (habitId) {
      AgendaData.updateHabit(habitId, data);
      UI.toast('✅ Hábito actualizado');
    } else {
      AgendaData.addHabit(data);
      UI.toast('✅ Hábito creado');
    }
    UI.hideModal();
    this.renderView('habits');
  },

  toggleHabitItem(id, dateStr) {
    AgendaData.toggleHabit(id, dateStr);
    this.renderView(this.state.currentView);
  },

  deleteHabitItem(id) {
    UI.showConfirm('¿Eliminar este hábito?', () => {
      AgendaData.deleteHabit(id);
      UI.toast('🗑️ Hábito eliminado');
      this.renderView('habits');
    });
  },

  // ---------- CRUD: Notes ----------
  openNoteForm(noteId) {
    UI.openNoteForm(noteId);
    setTimeout(() => document.getElementById('noteTitle')?.focus(), 100);
  },

  saveNoteForm(noteId) {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    if (!title && !content) { UI.toast('⚠️ Escribe al menos un título o contenido'); return; }
    const tagsRaw = document.getElementById('noteTags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(s => s.trim()).filter(s => s) : [];
    const data = {
      title: title || 'Sin título',
      date: document.getElementById('noteDate').value,
      content,
      tags,
    };

    if (noteId) {
      AgendaData.updateNote(noteId, data);
      UI.toast('✅ Nota actualizada');
    } else {
      AgendaData.addNote(data);
      UI.toast('✅ Nota creada');
    }
    UI.hideModal();
    this.renderView('notes');
  },

  deleteNoteItem(id) {
    UI.showConfirm('¿Eliminar esta nota?', () => {
      AgendaData.deleteNote(id);
      UI.toast('🗑️ Nota eliminada');
      this.renderView('notes');
    });
  },

  // ---------- CRUD: Gym ----------
  _nextGymExIdx: 0,

  openGymForm(routineId) {
    UI._currentGymId = routineId || null;
    UI.openGymForm(routineId);
    if (routineId) {
      const r = AgendaData.getGymRoutines().find(r => r.id === routineId);
      this._nextGymExIdx = (r && r.exercises) ? r.exercises.length : 0;
    } else {
      this._nextGymExIdx = 1;
    }
    setTimeout(() => document.getElementById('gymName')?.focus(), 100);
  },

  saveGymForm(routineId) {
    const name = document.getElementById('gymName').value.trim();
    if (!name) { UI.toast('⚠️ El nombre del entrenamiento es obligatorio'); return; }
    const date = document.getElementById('gymDate').value;
    if (!date) { UI.toast('⚠️ La fecha es obligatoria'); return; }

    const exercises = [];
    const exContainers = document.querySelectorAll('#gymExercises .gym-exercise');
    exContainers.forEach(exEl => {
      const exName = exEl.querySelector('.gym-exercise-name').value.trim();
      if (!exName) return;

      const sets = [];
      const setRows = exEl.querySelectorAll('.gym-set-row');
      setRows.forEach(row => {
        const weight = parseFloat(row.querySelector('input[id^="gymWeight_"]').value);
        const reps = parseInt(row.querySelector('input[id^="gymReps_"]').value);
        const rest = parseFloat(row.querySelector('select[id^="gymRest_"]').value);
        const done = row.querySelector('div[id^="gymDone_"]').classList.contains('checked');
        if (!isNaN(weight) && !isNaN(reps)) {
          sets.push({ weight, reps, rest: isNaN(rest) ? 1.5 : rest, done });
        }
      });

      if (sets.length > 0) {
        const notesEl = exEl.querySelector('input[id^="gymExNotes_"]');
        exercises.push({
          name: exName,
          sets,
          notes: notesEl ? notesEl.value.trim() : '',
        });
      }
    });

    if (exercises.length === 0) { UI.toast('⚠️ Agregá al menos un ejercicio con series'); return; }

    const data = { name, date, exercises };

    if (routineId) {
      AgendaData.updateGymRoutine(routineId, data);
      UI.toast('✅ Entrenamiento guardado');
    } else {
      const saved = AgendaData.addGymRoutine(data);
      routineId = saved.id;
    }

    // Update history
    const final = AgendaData.getGymRoutines().find(r => r.id === routineId);
    if (final) AgendaData._updateGymHistory(final);

    UI.hideModal();
    this.renderView('gym');
  },

  deleteGymItem(id) {
    UI.showConfirm('¿Eliminar este entrenamiento?', () => {
      AgendaData.deleteGymRoutine(id);
      UI.toast('🗑️ Entrenamiento eliminado');
      UI.hideModal();
      this.renderView('gym');
    });
  },

  addGymExercise() {
    const container = document.getElementById('gymExercises');
    const restOptions = [0.5, 1, 1.5, 2, 3, 5].map(v => ({ value: v, label: v >= 1 ? v + ' min' : '30s' }));
    const hist = AgendaData.getGymExerciseHistory();
    const idx = this._nextGymExIdx++;
    container.insertAdjacentHTML('beforeend', UI._gymExerciseHtml(null, idx, hist, restOptions));
    const input = document.getElementById(`gymExName_${idx}`);
    if (input) setTimeout(() => input.focus(), 50);
  },

  removeGymExercise(idx) {
    const el = document.querySelector(`.gym-exercise[data-ex-idx="${idx}"]`);
    if (el) el.remove();
    this.onGymSetChange();
  },

  addGymSet(exIdx) {
    const container = document.getElementById(`gymSets_${exIdx}`);
    if (!container) return;
    const restOptions = [0.5, 1, 1.5, 2, 3, 5].map(v => ({ value: v, label: v >= 1 ? v + ' min' : '30s' }));
    const existing = container.querySelectorAll('.gym-set-row').length;
    container.insertAdjacentHTML('beforeend', UI._gymSetHtml(exIdx, existing, '', '', 1.5, false, restOptions));
    this.onGymSetChange();
  },

  removeGymSet(exIdx, setIdx) {
    const container = document.getElementById(`gymSets_${exIdx}`);
    if (!container) return;
    const rows = container.querySelectorAll('.gym-set-row');
    if (rows[setIdx]) rows[setIdx].remove();
    this._recalcGymVolume();
  },

  _recalcGymVolume() {
    const volEl = document.getElementById('gymVolume');
    if (!volEl) return;
    let total = 0;
    document.querySelectorAll('#gymExercises .gym-exercise').forEach(ex => {
      ex.querySelectorAll('.gym-set-row').forEach(row => {
        const w = parseFloat(row.querySelector('input[id^="gymWeight_"]').value);
        const r = parseInt(row.querySelector('input[id^="gymReps_"]').value);
        if (!isNaN(w) && !isNaN(r)) total += w * r;
      });
    });
    volEl.innerHTML = `🏋️ Volumen total: <strong>${total.toLocaleString()} kg</strong>`;
  },

  onGymSetChange() {
    this._recalcGymVolume();
  },

  onGymExerciseNameChange(idx) {
    const nameEl = document.getElementById(`gymExName_${idx}`);
    if (!nameEl) return;
    const name = nameEl.value.trim();
    if (!name) return;
    const hist = AgendaData.getGymExerciseHistory();
    const h = hist[name];
    if (!h) return;
    // Pre-fill first empty set
    const wEl = document.getElementById(`gymWeight_${idx}_0`);
    const rEl = document.getElementById(`gymReps_${idx}_0`);
    if (wEl && rEl && !wEl.value && !rEl.value) {
      wEl.value = h.lastWeight || '';
      rEl.value = h.lastReps || '';
      this.onGymSetChange();
    }
  },

  // ---------- Settings ----------
  saveSettings() {
    const s = AgendaData.getSettings();
    const parse = (id, fallback) => { const v = parseInt(document.getElementById(id).value); return isNaN(v) ? fallback : v; };
    s.workStartHour = parse('setWorkStart', 8);
    s.workEndHour = parse('setWorkEnd', 18);
    AgendaData.saveSettings(s);
    UI.toast('✅ Configuración guardada');
    UI.hideModal();
    this.renderView(this.state.currentView);
  },

  updateCatColor(catId, color) {
    const cats = AgendaData.getCategories();
    const cat = cats.find(c => c.id === catId);
    if (cat) {
      cat.color = color;
      AgendaData.saveCategories(cats);
    }
  },

  // ---------- Export / Import / Clear ----------
  exportData() {
    const data = AgendaData.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenda_${UI._toDateStr(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('✅ Datos exportados');
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (AgendaData.importAll(data)) {
            UI.toast('✅ Datos importados correctamente');
            this.renderView(this.state.currentView);
          } else {
            UI.toast('⚠️ Formato de archivo inválido');
          }
        } catch {
          UI.toast('⚠️ Error al leer el archivo');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  clearAllData() {
    UI.showConfirm(
      '<p style="color:#ff6b6b;">¿Estás seguro? Se eliminarán TODOS tus datos (eventos, tareas, metas, hábitos y notas).</p><p style="color:#888;font-size:0.85rem;margin-top:8px;">Esta acción no se puede deshacer.</p>',
      () => {
        localStorage.removeItem('agenda_events');
        localStorage.removeItem('agenda_tasks');
        localStorage.removeItem('agenda_goals');
        localStorage.removeItem('agenda_habits');
        localStorage.removeItem('agenda_notes');
        localStorage.removeItem('agenda_gymRoutines');
        localStorage.removeItem('agenda_gymHistory');
        UI.toast('🗑️ Todos los datos eliminados');
        this.renderView(this.state.currentView);
      }
    );
  },
};

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => App.init());
