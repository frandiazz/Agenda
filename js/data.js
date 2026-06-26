const AgendaData = {
  _storage: window.localStorage,
  _prefix: 'agenda_',

  _get(key, fallback) {
    try {
      const raw = this._storage.getItem(this._prefix + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },

  _set(key, data) {
    this._storage.setItem(this._prefix + key, JSON.stringify(data));
  },

  // ---------- Categories ----------
  getCategories() {
    return this._get('categories', [
      { id: 'trabajo', label: 'Trabajo', color: '#4A90D9', icon: '💼' },
      { id: 'personal', label: 'Personal', color: '#7B68EE', icon: '🧑' },
      { id: 'salud', label: 'Salud', color: '#2ECC71', icon: '💪' },
      { id: 'estudio', label: 'Estudio', color: '#F39C12', icon: '📚' },
      { id: 'familia', label: 'Familia', color: '#E74C3C', icon: '👨‍👩‍👧‍👦' },
      { id: 'finanzas', label: 'Finanzas', color: '#1ABC9C', icon: '💰' },
      { id: 'social', label: 'Social', color: '#E91E63', icon: '🤝' },
      { id: 'ocio', label: 'Ocio', color: '#9B59B6', icon: '🎮' },
    ]);
  },

  saveCategories(cats) {
    this._set('categories', cats);
  },

  // ---------- Settings ----------
  getSettings() {
    return this._get('settings', {
      workStartHour: 8, workEndHour: 18,
    });
  },

  saveSettings(s) {
    this._set('settings', s);
  },

  // ---------- Events ----------
  getEvents() {
    return this._get('events', []);
  },

  isRecurringOnDate(event, dateStr) {
    if (!event.recurrence || event.recurrence === 'none') return false;
    if (event.exceptions && event.exceptions[dateStr]) return false;
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDay();
    switch (event.recurrence) {
      case 'daily': return true;
      case 'weekdays': return day >= 1 && day <= 5;
      case 'weekends': return day === 0 || day === 6;
      case 'weekly': {
        const orig = new Date(event.date + 'T12:00:00');
        return day === orig.getDay();
      }
      case 'custom': return event.recurrenceDays && event.recurrenceDays.includes(day);
      default: return false;
    }
  },

  getEventsByDate(date) {
    const all = this.getEvents();
    const direct = all.filter(e => e.date === date && (!e.recurrence || e.recurrence === 'none'));
    const recurring = all.filter(e => e.recurrence && e.recurrence !== 'none' && this.isRecurringOnDate(e, date));
    return [...direct, ...recurring];
  },

  getEventsInRange(startDate, endDate) {
    const all = this.getEvents();
    const direct = all.filter(e => e.date >= startDate && e.date <= endDate && (!e.recurrence || e.recurrence === 'none'));
    const recurring = all.filter(e => {
      if (!e.recurrence || e.recurrence === 'none') return false;
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      const d = new Date(start);
      while (d <= end) {
        const ds = d.toISOString().slice(0, 10);
        if (this.isRecurringOnDate(e, ds)) return true;
        d.setDate(d.getDate() + 1);
      }
      return false;
    });
    return [...direct, ...recurring];
  },

  addEvent(data) {
    const events = this.getEvents();
    const ev = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, createdAt: new Date().toISOString() };
    if (!ev.recurrence) ev.recurrence = 'none';
    if (ev.recurrence === 'none') ev.recurrenceDays = undefined;
    if (!ev.exceptions) ev.exceptions = {};
    events.push(ev);
    this._set('events', events);
    return ev;
  },

  updateEvent(id, data) {
    const events = this.getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    if (data.recurrence === 'none') data.recurrenceDays = undefined;
    events[idx] = { ...events[idx], ...data };
    this._set('events', events);
    return events[idx];
  },

  deleteEvent(id) {
    this._set('events', this.getEvents().filter(e => e.id !== id));
  },

  addException(eventId, dateStr) {
    const events = this.getEvents();
    const ev = events.find(e => e.id === eventId);
    if (!ev || !ev.recurrence || ev.recurrence === 'none') return null;
    if (!ev.exceptions) ev.exceptions = {};
    ev.exceptions[dateStr] = true;
    this._set('events', events);
    return ev;
  },

  isRecurring(event) {
    return event && event.recurrence && event.recurrence !== 'none';
  },

  getRecurrenceLabel(recurrence, recurrenceDays) {
    const labels = {
      daily: 'Todos los días',
      weekdays: 'Lun-Vie',
      weekends: 'Sáb-Dom',
      weekly: 'Semanal',
      custom: recurrenceDays ? recurrenceDays.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ') : 'Personalizado',
    };
    return labels[recurrence] || 'Una vez';
  },

  // ---------- Dream Trips ----------
  getDreamTrips() {
    return this._get('dreamTrips', []);
  },

  addDreamTrip(data) {
    const trips = this.getDreamTrips();
    const t = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, images: data.images || [], bucketList: data.bucketList || [], createdAt: new Date().toISOString() };
    trips.push(t);
    this._set('dreamTrips', trips);
    return t;
  },

  updateDreamTrip(id, data) {
    const trips = this.getDreamTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    trips[idx] = { ...trips[idx], ...data };
    this._set('dreamTrips', trips);
    return trips[idx];
  },

  deleteDreamTrip(id) {
    this._set('dreamTrips', this.getDreamTrips().filter(t => t.id !== id));
  },

  toggleBucketItem(tripId, itemIdx) {
    const trips = this.getDreamTrips();
    const t = trips.find(t => t.id === tripId);
    if (!t || !t.bucketList[itemIdx]) return null;
    t.bucketList[itemIdx].done = !t.bucketList[itemIdx].done;
    this._set('dreamTrips', trips);
    return t;
  },

  // ---------- Tasks ----------
  getTasks() {
    return this._get('tasks', []);
  },

  addTask(data) {
    const tasks = this.getTasks();
    const t = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, status: 'pending', createdAt: new Date().toISOString() };
    tasks.push(t);
    this._set('tasks', tasks);
    return t;
  },

  updateTask(id, data) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...data };
    this._set('tasks', tasks);
    return tasks[idx];
  },

  deleteTask(id) {
    this._set('tasks', this.getTasks().filter(t => t.id !== id));
  },

  toggleTask(id) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tasks[idx].status = tasks[idx].status === 'done' ? 'pending' : 'done';
    this._set('tasks', tasks);
    return tasks[idx];
  },

  // ---------- Goals ----------
  getGoals() {
    return this._get('goals', []);
  },

  addGoal(data) {
    const goals = this.getGoals();
    const g = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, progress: data.progress || 0, milestones: data.milestones || [], createdAt: new Date().toISOString() };
    goals.push(g);
    this._set('goals', goals);
    return g;
  },

  updateGoal(id, data) {
    const goals = this.getGoals();
    const idx = goals.findIndex(g => g.id === id);
    if (idx === -1) return null;
    goals[idx] = { ...goals[idx], ...data };
    this._set('goals', goals);
    return goals[idx];
  },

  deleteGoal(id) {
    this._set('goals', this.getGoals().filter(g => g.id !== id));
  },

  toggleMilestone(goalId, mileIdx) {
    const goals = this.getGoals();
    const g = goals.find(g => g.id === goalId);
    if (!g) return null;
    if (!g.milestones[mileIdx]) return null;
    g.milestones[mileIdx].done = !g.milestones[mileIdx].done;
    const done = g.milestones.filter(m => m.done).length;
    g.progress = g.milestones.length ? Math.round((done / g.milestones.length) * 100) : 0;
    this._set('goals', goals);
    return g;
  },

  // ---------- Habits ----------
  getHabits() {
    return this._get('habits', []);
  },

  addHabit(data) {
    const habits = this.getHabits();
    const h = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, logs: {}, streak: 0, createdAt: new Date().toISOString() };
    habits.push(h);
    this._set('habits', habits);
    return h;
  },

  updateHabit(id, data) {
    const habits = this.getHabits();
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) return null;
    habits[idx] = { ...habits[idx], ...data };
    this._set('habits', habits);
    return habits[idx];
  },

  deleteHabit(id) {
    this._set('habits', this.getHabits().filter(h => h.id !== id));
  },

  toggleHabit(id, date) {
    const habits = this.getHabits();
    const h = habits.find(habit => habit.id === id);
    if (!h) return null;
    if (!h.logs) h.logs = {};
    h.logs[date] = !h.logs[date];
    h.streak = this._calcStreak(h);
    this._set('habits', habits);
    return h;
  },

  _calcStreak(habit) {
    if (!habit.logs) return 0;
    const dates = Object.keys(habit.logs).filter(d => habit.logs[d]).sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (dates.includes(key)) streak++;
      else if (i > 0) break;
    }
    return streak;
  },

  // ---------- Notes ----------
  getNotes() {
    return this._get('notes', []);
  },

  getNotesByDate(date) {
    return this.getNotes().filter(n => n.date === date);
  },

  addNote(data) {
    const notes = this.getNotes();
    const n = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, createdAt: new Date().toISOString() };
    notes.push(n);
    this._set('notes', notes);
    return n;
  },

  updateNote(id, data) {
    const notes = this.getNotes();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    notes[idx] = { ...notes[idx], ...data };
    this._set('notes', notes);
    return notes[idx];
  },

  deleteNote(id) {
    this._set('notes', this.getNotes().filter(n => n.id !== id));
  },

  // ---------- Gym ----------
  getGymRoutines() {
    return this._get('gymRoutines', []);
  },

  addGymRoutine(data) {
    const list = this.getGymRoutines();
    const r = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), exercises: [], ...data, createdAt: new Date().toISOString() };
    list.push(r);
    this._set('gymRoutines', list);
    return r;
  },

  updateGymRoutine(id, data) {
    const list = this.getGymRoutines();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this._set('gymRoutines', list);
    return list[idx];
  },

  deleteGymRoutine(id) {
    this._set('gymRoutines', this.getGymRoutines().filter(r => r.id !== id));
  },

  getGymExerciseHistory() {
    return this._get('gymHistory', {});
  },

  _updateGymHistory(routine) {
    const hist = this.getGymExerciseHistory();
    (routine.exercises || []).forEach(ex => {
      if (!ex.name || !ex.sets || !ex.sets.length) return;
      const last = ex.sets[ex.sets.length - 1];
      if (last && last.weight != null && last.reps != null) {
        hist[ex.name] = { lastWeight: last.weight, lastReps: last.reps };
      }
    });
    this._set('gymHistory', hist);
  },

  // ---------- Export / Import ----------
  exportAll() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: this.getCategories(),
      settings: this.getSettings(),
      events: this.getEvents(),
      tasks: this.getTasks(),
      goals: this.getGoals(),
      habits: this.getHabits(),
      notes: this.getNotes(),
      dreamTrips: this.getDreamTrips(),
      gymRoutines: this.getGymRoutines(),
      gymHistory: this.getGymExerciseHistory(),
    };
  },

  importAll(data) {
    if (!data || !data.version) return false;
    if (data.categories) this._set('categories', data.categories);
    if (data.settings) this._set('settings', data.settings);
    if (data.events) this._set('events', data.events);
    if (data.tasks) this._set('tasks', data.tasks);
    if (data.goals) this._set('goals', data.goals);
    if (data.habits) this._set('habits', data.habits);
    if (data.notes) this._set('notes', data.notes);
    if (data.dreamTrips) this._set('dreamTrips', data.dreamTrips);
    if (data.gymRoutines) this._set('gymRoutines', data.gymRoutines);
    if (data.gymHistory) this._set('gymHistory', data.gymHistory);
    return true;
  },

  // ---------- Search ----------
  searchNotes(query) {
    const q = query.toLowerCase();
    return this.getNotes().filter(n =>
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
    );
  },
};
