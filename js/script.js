const KEY = '3d24c4f6fb12406e833135024222206',
    container = document.getElementById('container'),
    clean = document.getElementById('clean'),
    modal = document.getElementById('modal');
let coord_list = [];
coord_list = JSON.parse(localStorage.getItem('coordinates'));
let selected_coord = JSON.parse(localStorage.getItem('selected'));
let search_list = [];


let coord = '50.45331581086101,30.53815595207682';


const data_arr = [
    {
        name: 'Последнее обновление',
        value: 'last_updated',
        mark: ''
    },
    {
        name: 'Температура по ощущениям',
        value: 'feelslike_c',
        mark: '&#176;C'
    },
    {
        name: 'Скорость ветра',
        value: 'wind_kph',
        mark: 'км/ч'
    },
    {
        name: 'Направление ветра',
        value: 'wind_degree',
        mark: '&#176;'
    },
    {
        name: 'Давление',
        value: 'pressure_mb',
        mark: 'миллибар'
    },
    {
        name: 'Количество осадков',
        value: 'precip_mm',
        mark: 'мм'
    },
    {
        name: 'Влажность',
        value: 'humidity',
        mark: '%'
    },
    {
        name: 'Облачность',
        value: 'cloud',
        mark: '%'
    },
    {
        name: 'Порывы ветра',
        value: 'gust_kph',
        mark: 'км/ч'
    },
];
const day_name = ['Воскр.', 'Понед.', 'Вторн.', 'Среда', 'Четв.', 'Пятн.', 'Субб.'];

function openModal() {
    modal.classList.add('open');
    renderList();
}

function closeModal() {
    modal.classList.remove('open');
    if (coord_list) {
        query();
    } else {
        openModal();
    }
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

function query() {
    container.classList.add('reading');
    if (!selected_coord) {
        selected_coord = coord_list[0].coord;
    }
    renderSelectedList();
    fetch(`https://api.weatherapi.com/v1/forecast.json?key=${KEY}&q=${selected_coord}&days=10&aqi=yes&lang=ru&alerts=yes`)
        .then((response) => response.json())
        .then((data) => render(data));
}

function renderSelectedList() {
    const region = document.getElementById('region');
    let result = '';
    coord_list.forEach((el, i) => {
        result += `<option value="${el.coord}" ${el.coord===selected_coord?'selected':''}>${el.name}</option>`;
    });
    region.innerHTML = result;
}

function selectItemList(event) {
    selected_coord = event.target.value;
    query();
}

function renderList() {
    const list = document.getElementById('list_coordinates');
    if (coord_list) {
        let result = '';
        coord_list.forEach((el, i) => {
            result += `<div class="selected-item"><p class="name">${el.name}</p>
<div onclick="selectedItem(${i})" class="svg ok ${el.coord === selected_coord ? 'selected' : ''}"></div>
<div onclick="deleteItem(${i})" class="svg delete"></div></div>`;
        });
        list.innerHTML = result;
    } else {
        list.innerHTML = '';
    }
}

function selectedItem(i) {
    selected_coord = coord_list[i].coord;
    localStorage.setItem('selected', JSON.stringify(selected_coord));
    renderList();
}

function deleteItem(i) {
    if (coord_list[i].coord === selected_coord) {
        localStorage.removeItem('selected');
        selected_coord = '';
    }
    coord_list.splice(i, 1);
    if (coord_list.length > 0) {
        localStorage.setItem('coordinates', JSON.stringify(coord_list));
    } else {
        coord_list = null;
        localStorage.removeItem('coordinates');
    }
    renderList();
}

function clearInput() {
    clean.style.cssText = '';
    document.getElementById('input').value = '';
    searchRender([]);
}

function search(event) {
    clean.style.cssText = 'opacity: 1;';
    fetch(`https://nominatim.openstreetmap.org/search?q=${event.target.value}&format=json`)
        .then((response) => response.json())
        .then((data) => searchRender(data));
}

function searchRender(data) {
    search_list = data;
    const block = document.getElementById('search_list');
    let string = '';
    data.forEach((e, i) => {
        string += `<div class="list-item" onclick="addItem(${i})">${e.display_name}</div>`;
    });
    block.innerHTML = string;
}

function addItem(element) {
    console.log(search_list[element]);
    let item = {
        name: search_list[element].display_name.split(',')[0],
        coord: search_list[element].lat + ',' + search_list[element].lon
    };
    if (coord_list) {
        coord_list.push(item);
    } else {
        coord_list = [];
        coord_list.push(item);
    }
    localStorage.setItem('coordinates', JSON.stringify(coord_list));
    clearInput();
    renderList();
}

function render(data) {
    renderToDay(data);
    container.classList.remove('reading');
}

function renderToDay(data) {
    const icon = document.getElementById('icon'),
        text = document.getElementById('text'),
        other = document.getElementById('other'),
        today = document.getElementById('today'),
        temperature = document.getElementById('temperature');
    if (data.current.is_day === 1) {
        container.classList.add('day');
    } else {
        container.classList.add('night');
    }
    icon.setAttribute('alt', `${data.current.condition.text}`);
    icon.setAttribute('src', `${data.current.condition.icon.replace('64x64', '128x128')}`);
    temperature.innerText = `${data.current.temp_c}`;
    text.innerText = `${data.current.condition.text}`;
    inner = '';
    data_arr.forEach((el) => {
        if (el.value === 'last_updated') {
            inner += `<div class="row"><div class="name">${el.name}</div><div class="value">${lastReload(data.current[el.value])}<span> ${el.mark}</span></div></div>`;
        } else {
            inner += `<div class="row"><div class="name">${el.name}</div><div class="value">${data.current[el.value]}<span> ${el.mark}</span></div></div>`;
        }
    });
    other.innerHTML = inner;
    today.innerText = toDay(data.location.localtime);
    renderHours(data);
    renderDays(data);
}

function renderHours(data) {
    const hour_list = document.getElementById('hours');
    const hour_block = document.getElementById('hour_block');
    let result = '';
    let num = 0;
    data.forecast.forecastday[0].hour.forEach((el, i) => {
        const time = new Date(el.time);
        const now = new Date();
        if (now.getHours() === time.getHours()) {
            result += `<div class="hours-item active">`;
            num = i;
        } else {
            result += `<div class="hours-item">`;
        }
        result += `<p class="tem">${el.temp_c}&#176;C</p><img class="icon-hour" src="${el.condition.icon}" alt="${el.condition.text}">
<p class="tem">${time.getHours()}:${time.getMinutes()}</p></div>`;
    });
    hour_list.innerHTML = result;
    if (num < 21) {
        hour_block.scrollTo(num * 82, 0);
    } else {
        hour_block.scrollTo(1722, 0);
    }
}

function renderDays(data) {
    const day_list = document.getElementById('next_day');
    let result = '';
    data.forecast.forecastday.forEach(el => {
        const time = new Date(el.date);
        result += `<div class="day-item"><p class="day-name">${day_name[time.getDay()]}</p>
                <img src="${el.day.condition.icon}" alt="${el.day.condition.text}">
                <p class="term">${el.day.maxtemp_c} &#176;C <span>${el.day.mintemp_c} &#176;C</span></p></div>`;
    });
    day_list.innerHTML = result;
}

function toDay(time) {
    const date = new Date(time);
    const month = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${date.getDate()} ${month[date.getMonth()]}`;
}

function lastReload(time) {
    const date = new Date(time);
    return `${date.getHours()}:${date.getMinutes()}`;
}

if (coord_list) {
    query();
} else {
    openModal();
}
