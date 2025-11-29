import {
  domify,
  classes as domClasses,
  event as domEvent
} from 'min-dom';

import {
  TOGGLE_MODE_EVENT,
  RESET_SIMULATION_EVENT
} from '../../util/EventHelper';

import {
  PauseIcon,
  PlayIcon
} from '../../icons';


export default function PauseAllActivities(eventBus, tokenSimulationPalette, simulator, notifications) {
  console.log("PauseAllActivities loaded")
  this._eventBus = eventBus;
  this._tokenSimulationPalette = tokenSimulationPalette;
  this._simulator = simulator;
  this._notifications = notifications;

  this.isActive = false;
  this.isPausedAll = false;

  this._init();

  eventBus.on(TOGGLE_MODE_EVENT, (event) => {
    const active = event.active;

    if (active) {
      this.activate();
    } else {
      this.deactivate();
    }
  });

  eventBus.on(RESET_SIMULATION_EVENT, () => {
    this.unpauseAll();
  });
}

PauseAllActivities.prototype._init = function() {
  this._paletteEntry = domify(`
    <div class="bts-entry disabled" title="Pause All Activities">
      ${ PauseIcon() }
    </div>
  `);

  domEvent.bind(this._paletteEntry, 'click', () => {
    this.toggle();
  });

  this._tokenSimulationPalette.addEntry(this._paletteEntry, 3);
};

PauseAllActivities.prototype.toggle = function() {
  if (!this.isActive) {
    return;
  }

  if (this.isPausedAll) {
    this.unpauseAll();
  } else {
    this.pauseAll();
  }
};

PauseAllActivities.prototype.pauseAll = function() {
  if (!this.isActive) {
    return;
  }

  this._simulator.pauseAllActivities();

  domClasses(this._paletteEntry).add('active');
  this._paletteEntry.innerHTML = `${ PlayIcon() }`;
  this._paletteEntry.title = 'Resume All Activities';

  this._notifications.showNotification({
    text: 'Paused All Activities',
    type: 'info'
  });

  this.isPausedAll = true;
};

PauseAllActivities.prototype.unpauseAll = function() {
  if (!this.isActive && !this.isPausedAll) {
    return;
  }

  this._simulator.unpauseAllActivities();

  domClasses(this._paletteEntry).remove('active');
  this._paletteEntry.innerHTML = `${ PauseIcon() }`;
  this._paletteEntry.title = 'Pause All Activities';

  if (this.isPausedAll) {
    this._notifications.showNotification({
      text: 'Resumed All Activities',
      type: 'info'
    });
  }

  this.isPausedAll = false;
};

PauseAllActivities.prototype.activate = function() {
  this.isActive = true;
  domClasses(this._paletteEntry).remove('disabled');
};

PauseAllActivities.prototype.deactivate = function() {
  this.isActive = false;
  this.unpauseAll();
  domClasses(this._paletteEntry).add('disabled');
};

PauseAllActivities.$inject = [
  'eventBus',
  'tokenSimulationPalette',
  'simulator',
  'notifications'
];
