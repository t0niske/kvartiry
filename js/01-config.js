'use strict';
/* =========================================================
   НАСТРОЙКИ — ЖК, цены, отделка, ипотека
   ========================================================= */
const BRAND = 'DOGMA';
const CUR = '₽';
const MORT = {down: .2, years: 30, rate: .06, prog: 0};
/* Ставки примерные — поправьте под актуальные условия банков-партнёров */
const MORT_PROGS = [{name: 'Семейная', rate: .06}, {name: 'IT-ипотека', rate: .06}, {name: 'Базовая', rate: .18}];
const MANAGER = {name: '', phone: '8 800 000-00-00'};

const FINISHES = [
  {id:'rough', name:'Черновая', badge:'База', ppm:0, term:'Сразу после сдачи',
   desc:'Бетонные стены и стяжка — полная свобода для собственного проекта.',
   inc:['Стяжка пола','Штукатурка стен','Электроразводка','Стояки воды','Окна','Входная дверь']},
  {id:'dev', name:'От застройщика', badge:'White box', ppm:18000, term:'Входит в сдачу дома',
   desc:'Светлые стены, ламинат, плитка и сантехника. Можно въезжать и обставлять.',
   inc:['Окрашенные стены','Ламинат 33 класса','Плитка в санузле','Сантехника','Межкомнатные двери','Подоконники, плинтус']},
  {id:'turn', name:'Ремонт под ключ', badge:'Под ключ', ppm:45000, term:'90 дней',
   desc:'Дизайн-проект, премиальные материалы, кухня, мебель и свет. Заезжаете с чемоданом.',
   inc:['Дизайн-проект','Паркет «ёлочка»','Декоративная штукатурка','Кухня с техникой','Мебель и текстиль','Сценарии света']}
];
const FIN = Object.fromEntries(FINISHES.map(f => [f.id, f]));

/* Стили фасадов (сверены с официальными визуализациями dogma.ru, 10.2026) */
const STYLES = {
  rekord:  {wall:'brick',   color:'#a9502f', frame:'#252628', band:'#252628', glaze:'ribbon', podium:'#cfc2aa', podiumWall:'stone', cap:'#2a2b2e', glass:'#5d7283', led:true, balcony:3},
  samT:    {wall:'brick',   color:'#3a3533', frame:'#c79c52', band:'#c79c52', glaze:'tall',   podium:'#3b322c', podiumWall:'stone', cap:'#c79c52', glass:'#5b6d7c'},
  samW:    {wall:'brick',   color:'#c4bbae', frame:'#2f3134', band:'#6a5546', glaze:'punched',podium:'#3b322c', podiumWall:'stone', cap:'#2f3134', glass:'#5f7383', accent:'#6a5546'},
  reeds:   {wall:'brick',   color:'#6e2d2e', frame:'#1d1d1f', band:null,      glaze:'grid',   podium:'#2b2b2d', podiumWall:'stone', cap:'#1d1d1f', glass:'#506372'},
  park:    {wall:'brick',   color:'#b9b3ab', frame:'#a8875f', band:'#e8e2d6', glaze:'french', podium:'#2f2a27', podiumWall:'stone', cap:'#a8875f', glass:'#55687a', lower:{color:'#4e3c33', wall:'brick', floors:7}}
};

/* Корпуса: x,z — центр, r — поворот, w×d — габарит, f — этажей (с первым), s — стиль, c — свой цвет фасада.
   Лицевой фасад (до поворота) смотрит в +z. Двор, школа, храм и т.п. — в extras */
const PI = Math.PI;
const COMPLEXES = [
  {id:'rekord', name:'Рекорд 2', cls:'Бизнес-класс', district:'ул. Новороссийская, Черёмушки', deadline:'31.10.2026', ppm:215000, seed:7,
   photo:'https://storage.yandexcloud.net/t2v-storage/images/29eeda16-000c-46d1-ac42-0574624085d6/w800.webp',
   sky:['#5f8fc8','#dfe8ee','#7c8670'], playColors:['#4f9a6a','#3aa3a8','#e08a3a','#4bb4d6'],
   buildings:[
     {x:-44,z:-38,w:28,d:18,f:24,s:'rekord'},{x:-16,z:-37,w:28,d:18,f:22,s:'rekord'},
     {x:20,z:-30,w:30,d:18,f:24,s:'rekord'},{x:38,z:-6,r:PI/2,w:28,d:18,f:24,s:'rekord'},
     {x:-62,z:-6,r:-PI/2,w:30,d:18,f:24,s:'rekord'},{x:-46,z:20,w:20,d:20,f:24,s:'rekord'},
     {x:-10,z:30,r:PI,w:28,d:18,f:24,s:'rekord'},
     {x:78,z:-26,w:28,d:18,f:24,s:'rekord'},{x:94,z:-2,r:-PI/2,w:24,d:18,f:22,s:'rekord'},{x:82,z:34,r:PI,w:28,d:18,f:24,s:'rekord'}],
   yards:[{x:-3,z:-1.5,w:58,d:37},{x:66,z:4,w:34,d:34}],
   extras:{school:{x:-22,z:72}, stadium:{x:28,z:70}, church:{x:28,z:32}, rail:{z:-78}}},
  {id:'samolet7', name:'Самолёт 7', cls:'Бизнес-класс', district:'Западный обход', deadline:'30.09.2028', ppm:158000, seed:21,
   photo:'https://storage.yandexcloud.net/t2v-storage/images/6cd266b1-8f0a-4c04-9e1f-74f67bdf402c/w800.webp',
   sky:['#6a9ad0','#e3ebf0','#7d8a6f'], playColors:['#d9573f','#f2b84b','#5aa0a8','#7bb661'],
   buildings:[
     {x:-44,z:-28,w:22,d:18,f:20,s:'samT'},{x:16,z:-30,w:22,d:18,f:22,s:'samT'},{x:62,z:-2,r:-PI/2,w:22,d:18,f:20,s:'samT'},{x:-58,z:26,r:PI/2,w:20,d:18,f:18,s:'samT'},
     {x:-17,z:-30,w:28,d:15,f:12,s:'samW'},{x:-58,z:-2,r:PI/2,w:26,d:15,f:10,s:'samW'},{x:-26,z:30,r:PI,w:40,d:15,f:9,s:'samW'},
     {x:2,z:0,r:PI/2,w:34,d:15,f:12,s:'samW'},{x:42,z:-30,w:24,d:15,f:12,s:'samW'},{x:34,z:28,r:PI,w:40,d:15,f:10,s:'samW'}],
   yards:[{x:-28,z:2,w:38,d:34},{x:31,z:-1,w:36,d:36}],
   extras:{kindergarten:{x:-6,z:56}}},
  {id:'reed', name:'РИДЗ', cls:'Бизнес-класс', district:'ул. Пригородная, у реки', deadline:'31.05.2028', ppm:165000, seed:42,
   photo:'https://storage.yandexcloud.net/t2v-storage/images/8f8f9dca-33fe-4d38-b464-7508fd3ca595/w800.webp',
   sky:['#5d86bd','#e6e4df','#7a8170'], playColors:['#5aa0a8','#c9a46a','#7bb661','#d9573f'],
   buildings:[
     {x:-40,z:-40,w:22,d:20,f:25,s:'reeds',c:'#6e2d2e'},{x:0,z:-40,w:22,d:20,f:18,s:'reeds',c:'#3b3634'},{x:40,z:-40,w:22,d:20,f:22,s:'reeds',c:'#c8b193'},
     {x:-40,z:-2,r:PI/2,w:22,d:20,f:16,s:'reeds',c:'#c8b193'},{x:40,z:-2,r:-PI/2,w:22,d:20,f:24,s:'reeds',c:'#7f3a30'},
     {x:-40,z:36,r:PI,w:22,d:20,f:20,s:'reeds',c:'#3b3634'},{x:0,z:36,r:PI,w:22,d:20,f:19,s:'reeds',c:'#8a7c6e'},{x:40,z:36,r:PI,w:22,d:20,f:23,s:'reeds',c:'#6e2d2e'}],
   yards:[{x:0,z:-2,w:56,d:38}], extras:{water:{z:86}}},
  {id:'park3', name:'Парк Победы 3', cls:'Бизнес-класс', district:'Западный обход', deadline:'27.07.2029', ppm:150000, seed:55,
   photo:'https://storage.yandexcloud.net/t2v-storage/images/18f3aa75-5823-4dfa-a04a-327eb49354e0/w2000.webp',
   sky:['#6c9bcf','#e6edef','#7f8b6c'], playColors:['#c9a46a','#7bb661','#5aa0a8','#e08a3a'],
   buildings:[
     {x:-42,z:-6,w:24,d:20,f:21,s:'park'},{x:42,z:-6,w:24,d:20,f:21,s:'park'},
     {x:-15,z:-22,w:30,d:16,f:14,s:'park'},{x:15,z:-22,w:30,d:16,f:12,s:'park'},
     {x:-24,z:22,r:PI,w:24,d:16,f:9,s:'park'},{x:24,z:22,r:PI,w:24,d:16,f:9,s:'park'}],
   yards:[{x:0,z:0,w:56,d:24}], extras:{arch:{x:0,z:0}}}
];

/* Планировки: комнаты [x, z, ширина, глубина] в метрах; z = D — фасад с окнами */
const TPL = {
  0:{W:5.4, D:6.2, entry:0, rooms:[
    {n:'Прихожая',t:'hall',r:[0,0,2.6,2.2]},
    {n:'Санузел',t:'bath',r:[2.6,0,2.8,2.2]},
    {n:'Студия',t:'studio',r:[0,2.2,5.4,4.0]}],
    doors:[[0,1],[0,2]]},
  1:{W:7.0, D:6.4, entry:0, rooms:[
    {n:'Прихожая',t:'hall',r:[0,0,3.6,2.4]},
    {n:'Санузел',t:'bath',r:[3.6,0,3.4,2.4]},
    {n:'Кухня',t:'kitchen',r:[0,2.4,3.0,4.0]},
    {n:'Спальня-гостиная',t:'bedroom',r:[3.0,2.4,4.0,4.0]}],
    doors:[[0,1],[0,2],[2,3]]},
  2:{W:9.6, D:7.0, entry:0, rooms:[
    {n:'Прихожая',t:'hall',r:[0,0,3.0,2.6]},
    {n:'Санузел',t:'bath',r:[3.0,0,2.2,2.6]},
    {n:'Гардеробная',t:'storage',r:[5.2,0,4.4,2.6]},
    {n:'Кухня-гостиная',t:'kitchen',r:[0,2.6,5.2,4.4]},
    {n:'Спальня',t:'bedroom',r:[5.2,2.6,4.4,4.4]}],
    doors:[[0,1],[0,3],[3,4],[4,2]]},
  3:{W:12.4, D:7.4, entry:0, rooms:[
    {n:'Прихожая',t:'hall',r:[0,0,5.0,2.8]},
    {n:'Санузел',t:'bath',r:[5.0,0,2.4,2.8]},
    {n:'Постирочная',t:'laundry',r:[7.4,0,1.6,2.8]},
    {n:'Гардеробная',t:'storage',r:[9.0,0,3.4,2.8]},
    {n:'Кухня-гостиная',t:'kitchen',r:[0,2.8,5.0,4.6]},
    {n:'Спальня',t:'bedroom',r:[5.0,2.8,3.7,4.6]},
    {n:'Детская',t:'kids',r:[8.7,2.8,3.7,4.6]}],
    doors:[[0,1],[0,4],[4,5],[5,6],[6,3],[1,2]]}
};
const TPL_AREA = {};
for (const k in TPL) TPL_AREA[k] = TPL[k].rooms.reduce((s, r) => s + r.r[2] * r.r[3], 0);
const roomWord = r => r === 0 ? 'Студия' : r + '-комнатная';
const roomShort = r => r === 0 ? 'Ст' : r + 'к';

/* Как выглядят поверхности: [цвет, текстура, шероховатость] */
const LOOK = {
  rough:{wall:['#ffffff','concrete',.95], wet:['#ffffff','concrete',.95], floor:['#d9d6d0','concrete',.9], wetFloor:['#d9d6d0','concrete',.9], ceil:['#ffffff','concrete',.95]},
  dev:  {wall:['#f3f1ec','paint',.9],     wet:['#ffffff','tile',.25],     floor:['#ffffff','laminate',.55], wetFloor:['#ffffff','tile',.25], ceil:['#fbfaf8',null,.95]},
  turn: {wall:['#ffffff','plaster',.92],  wet:['#ffffff','tileDark',.18], floor:['#ffffff','herring',.42], wetFloor:['#ffffff','tileDark',.18], ceil:['#fbfaf8',null,.95]}
};
const LIGHT = {rough:[0xffc98a,.45], dev:[0xfff1dd,.6], turn:[0xffd29a,.95]};
