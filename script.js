document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    const applyButton = document.getElementById('applySettings');

    const savedTheme = localStorage.getItem('roforum_theme') || 'light';

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        if (themeSelect) themeSelect.value = theme;
    }

    applyTheme(savedTheme);

    if (applyButton) {
        applyButton.addEventListener('click', () => {
            const newTheme = themeSelect ? themeSelect.value : 'light';
            localStorage.setItem('roforum_theme', newTheme);
            applyTheme(newTheme);
        });
    }

    const accordionHeaders = document.querySelectorAll('.rules-accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target');
            const body = document.getElementById(targetId);
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header) {
                    otherHeader.classList.remove('open');
                    const otherTargetId = otherHeader.getAttribute('data-target');
                    const otherBody = document.getElementById(otherTargetId);
                    if (otherBody) otherBody.classList.remove('open');
                }
            });
            header.classList.toggle('open');
            if (body) body.classList.toggle('open');
        });
    });

    const daySelect = document.getElementById('day');
    const monthSelect = document.getElementById('month');
    const yearSelect = document.getElementById('year');

    if (daySelect && monthSelect && yearSelect) {
        function populateDays() {
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearSelect.value);
            const currentDay = daySelect.value;
            daySelect.innerHTML = '<option value="">День</option>';
            if (!month) return;
            let daysInMonth = 31;
            if (month === 4 || month === 6 || month === 9 || month === 11) {
                daysInMonth = 30;
            } else if (month === 2) {
                if (year && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
                    daysInMonth = 29;
                } else {
                    daysInMonth = 28;
                }
            }
            for (let i = 1; i <= daysInMonth; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                if (currentDay == i) option.selected = true;
                daySelect.appendChild(option);
            }
        }

        function populateYears() {
            const currentYear = new Date().getFullYear();
            yearSelect.innerHTML = '<option value="">Год</option>';
            for (let i = currentYear; i >= 1927; i--) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                yearSelect.appendChild(option);
            }
        }

        populateYears();
        populateDays();
        monthSelect.addEventListener('change', populateDays);
        yearSelect.addEventListener('change', populateDays);
    }

    const registerForm = document.querySelector('.register-form');
    if (registerForm && window.location.pathname.includes('register')) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.querySelector('input[type="text"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;
            const month = document.getElementById('month').value;
            const day = document.getElementById('day').value;
            const year = document.getElementById('year').value;

            if (!validateUsername(username)) {
                alert('Ник должен быть от 4 до 15 символов и содержать только буквы, цифры и подчёркивания.');
                return;
            }

            const { data: existing } = await supabase
                .from('accounts')
                .select('id')
                .eq('username', username)
                .single();

            if (existing) {
                alert('Пользователь с таким ником уже существует.');
                return;
            }

            const passwordHash = btoa(password);
            const { data: account, error } = await supabase
                .from('accounts')
                .insert({
                    username,
                    password_hash: passwordHash,
                    role: 'user'
                })
                .select()
                .single();

            if (error) {
                alert('Ошибка при регистрации.');
                return;
            }

            const ip = await getIP();
            const hwid = getHWID();
            const token = crypto.randomUUID();

            await supabase.from('sessions').insert({
                account_id: account.id,
                token,
                ip_address: ip,
                hwid
            });

            localStorage.setItem('session_token', token);
            window.location.href = '/index.html';
        });
    }

    const loginForm = document.querySelector('.register-form');
    if (loginForm && window.location.pathname.includes('login')) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = loginForm.querySelector('input[type="text"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            const { data: account, error } = await supabase
                .from('accounts')
                .select('*')
                .or(`username.eq.${login}`)
                .single();

            if (error || !account) {
                alert('Неверный логин или пароль.');
                return;
            }

            if (account.banned) {
                alert(`Аккаунт заблокирован.\nПричина: ${account.ban_reason}\nДо: ${new Date(account.ban_end).toLocaleDateString()}`);
                return;
            }

            const passwordHash = btoa(password);
            if (passwordHash !== account.password_hash) {
                alert('Неверный логин или пароль.');
                return;
            }

            const ip = await getIP();
            const hwid = getHWID();
            const token = crypto.randomUUID();

            await supabase.from('sessions').insert({
                account_id: account.id,
                token,
                ip_address: ip,
                hwid
            });

            localStorage.setItem('session_token', token);
            window.location.href = '/index.html';
        });
    }
});
