document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    const App = {
        theme: localStorage.getItem('theme') || 'dark',
        themeApplied: false,

        init() {
            this.applyTheme();
            this.initEventListeners();
            this.initTooltips();
        },

        applyTheme() {
            if (this.themeApplied) return;
            document.documentElement.setAttribute('data-theme', this.theme);
            this.themeApplied = true;
        },

        toggleTheme() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', this.theme);
            document.documentElement.setAttribute('data-theme', this.theme);
        },

        initEventListeners() {
            document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
                btn.addEventListener('click', () => this.toggleTheme());
            });
        },

        initTooltips() {
            document.querySelectorAll('[title]').forEach(el => {
                new bootstrap.Tooltip(el);
            });
        }
    };

    window.OmniRouteApp = App;
    App.init();
});
