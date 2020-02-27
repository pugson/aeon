import AeonElement from './aeon.js';

class Calendar extends AeonElement {
  static get props() {
    return {
      value: {
        type: String
      },
      days: {
        type: Array
      },
      year: {
        type: Number
      },
      month: {
        type: Number
      },
      day: {
        type: Number
      },
      open: {
        type: Boolean
      }
    };
  }

  constructor() {
    super();

    this.days = [];
    this.open = false;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.onClickOutside);
  }

  firstRender(_) {
    _.innerHTML = `
      <style>
        :host {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding: 0.2rem;
          background-color: var(--bgColor);
        }

        :host([open]) {
          display: flex;
        }

        .week {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        aeon-year, aeon-month {
          width: 50%;
          position: relative;
        }

        aeon-month {
          margin-left: 1rem;
        }

        .day, .date, button {
          color: var(--color);
          background-color: transparent;
          border: 0;
          box-sizing: border-box;
          width: 2.4rem;
          height: 2.4rem;
          padding: 0;
          font-size: calc(2.4rem / 3);

          text-transform: uppercase;

          flex-grow: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .date {
          border: 1px solid var(--hintColor);
          border-width: 0 0 1px 1px;
        }

        .date:last-child {
          border-right-width: 1px;
        }

        .date.last + .spacer {
          border-left-width: 1px;
        }

        .week:nth-child(2) .date:not(.spacer) {
          border-top-width: 1px;
        }

        .week:last-child .spacer {
          border-right-width: 0;
          border-bottom-width: 0;
        }

        .date.today {
          font-weight: bold;
        }

        .date:hover, .date.today {
          font-size: 1.3rem;
        }

        .date.spacer {
          border-left-width: 0;
          pointer-events: none;
        }

        #buttons {
          width: 100%;
          display: flex;
          justify-content: space-between;
        }

        #year-month {
          display: flex;
          width: 100%;
        }
      </style>

      <div id="buttons">
        <button id="cancel" title="Cancel">
          <svg width="24" height="24">
            <g><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></g>
          </svg>
        </button>
        <button id="clear" title='Clear'>
          <svg width="24" height="24">
            <g><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></g>
          </svg>
        </button>
      </div>
      <div id="year-month">
        <aeon-year id="year"></aeon-year>
        <aeon-month id="month"></aeon-month>
      </div>
      <div id="calendar"></div>
    `;
  }

  firstRendered(_) {
    this.addEventListener('keyup', event => {
      switch (event.key) {
        case 'Escape':
          this.open = false;
          break;
      }
    });

    this.$.year.addEventListener('change', event => {
      this.year = event.target.value;
    });

    this.$.month.addEventListener('change', event => {
      this.month = event.target.value;
    });

    this.$.calendar.addEventListener('click', this.onDateClick.bind(this));

    this.$.cancel.addEventListener('click', () => {
      this.open = false;
    });

    this.$.clear.addEventListener('click', () => {
      this.open = true;
    });
  }

  render(_, triggers) {
    if ('year' in triggers || 'month' in triggers || 'day' in triggers) {
      this.value = this.formatAsDate(this.year, this.month, this.day);
    }

    if ('value' in triggers) {
      this.dispatchEvent(
        new Event('change', {
          bubbles: true
        })
      );
    }

    const now = new Date();
    now.setMonth(0, 1);

    this.$.year.value = this.year;
    this.$.year.years = [];
    for (let i = this.startYear; i <= this.endYear; i++) {
      this.$.year.years.push(i);
    }

    this.$.month.value = this.month;
    this.$.month.months = [];
    for (let i = 0; i < 12; i++) {
      let monthNum = now.getMonth();
      this.$.month.months.push({
        num: monthNum,
        name: now.toLocaleString(this._locale, { month: 'short' })
      });
      now.setMonth(i + 1);
    }
    this.$.month.months.sort((a, b) => a.num - b.num);

    now.setDate(0, 1);
    this.days = [];
    for (let i = 0; i < 7; i++) {
      let dayNum = now.getDay();
      this.days.push({
        num: dayNum,
        name: now.toLocaleString(this._locale, { weekday: 'short' })
      });
      now.setDate(i + 2);
    }
    const startDayOffset = 7 - this.startDay;
    this.days.sort(
      (a, b) => ((a.num + startDayOffset) % 7) - ((b.num + startDayOffset) % 7)
    );

    ////

    let workingDate = new Date(this.year, this.month, 1, 12);
    const monthStartDay = workingDate.getDay();

    workingDate.setMonth(workingDate.getMonth() + 1);
    workingDate.setDate(0);
    const daysInMonth = workingDate.getDate();

    workingDate = new Date(this.year, this.month, 1, 12);

    let started = false;
    let finished = false;
    let count = 0;

    this.$.calendar.innerHTML = `
      <div class="week">
        ${this.days.map(day => `<div class="day">${day.name}</div>`).join('')}
      </div>

      ${[0, 1, 2, 3, 4, 5]
        .map(() => {
          if (count > daysInMonth) return null;

          return `
          <div class="week">
            ${this.days
              .map(day => {
                const dayNum = day.num % 7;
                if (dayNum === monthStartDay) {
                  started = true;
                }

                let date = '';
                if (started) {
                  count += 1;
                  if (count <= daysInMonth) {
                    date = count;
                    workingDate.setDate(date);
                  } else {
                    finished = true;
                  }
                }

                const isToday = count === this.day;

                return `
                  <button class="date ${isToday ? 'today' : ''} ${
                  !started || finished ? 'spacer' : ''
                } ${count === daysInMonth ? 'last' : ''}" data-day="${count}" ${
                  !started || finished ? "tabindex='-1' disabled" : ''
                }>${date}</button>
              `;
              })
              .join('')}
          </div>
         `;
        })
        .join('')}
    `;

    const focusableEls = this.shadowRoot.querySelectorAll(
      'button:not([disabled]), select'
    );
    this._firstFocusableEl = focusableEls[0];
    this._lastFocusableEl = focusableEls[focusableEls.length - 1];
  }

  onKeyDown(event) {
    const isTabPressed = event.key === 'Tab';

    if (!isTabPressed) {
      return;
    }

    const activeElement = this.shadowRoot.activeElement;

    if (event.shiftKey && activeElement === this._firstFocusableEl) {
      this._lastFocusableEl.focus();
      event.preventDefault();
    } else if (!event.shiftKey && activeElement === this._lastFocusableEl) {
      this._firstFocusableEl.focus();
      event.preventDefault();
    }
  }

  onDateClick(event) {
    if (event.target.classList.contains('date')) {
      const button = event.target;
      this.day = parseInt(button.dataset.day, 10);

      this.value = this.formatAsDate(this.year, this.month, this.day);
    }
  }

  formatAsDate(year, month, day) {
    return `${year}-${`${month + 1}`.padStart(2, '0')}-${`${day}`.padStart(
      2,
      '0'
    )}`;
  }
}

export default Calendar;
