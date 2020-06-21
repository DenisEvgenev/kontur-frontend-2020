## Пример написания кода на чистом JavaScript, находится в файле client/game.mjs
Написал самодокументируемый код. Для решения задачи использовал алгоритм поиска пути A-star.  
Код писал только в client/game.mjs. Остальные файлы были архиве с задачей.
Ниже описание самой задачи.  

# kontur-frontend-2020

# Описание задачи
Написать бота для игры «Морская торговля».  
В игре вы играете за торговый корабль, задача которого заработать как можно больше денег, продавая разные товары в разные города.    
  
# Цель игры
Цель — заработать как можно больше денег в сумме за все уровни.  

# Технические требования:
Браузер, поддерживающий JS модули  
Node.js 10 или 13 версии  
npm ≥ 6 версии  

# Запуск игры
Установить все зависимости в директории задачи при помощи команды в терминале npm install  
Запустить приложение, выполнив команду npm start  
Перейти в браузере по адресу localhost:3000

# Где писать код, что можно и чего нельзя
Писать код нужно в файле game.mjs. Именно этот файл нужно будет загрузить на проверку. Все остальные файлы показывают, как ваш бот играет на разных предзагруженных уровнях. Изменения в остальные файлы вносить не рекомендуется, потому что при проверке файлы будут запускаться в исходном виде.  

В файле game.mjs должны быть написаны (и заэкспортированы именованным экспортом) две функции: startGame и getNextCommand. В выданных файлах они уже написаны, можно просто дописать в них содержимое и все будет работать. Их интерфейс описан ниже в разделе «Процесс игры»  
# Процесс игры
Когда в интерфейсе пользователь нажимает кнопку «Начать», вызывается функция startGame. В эту функцию передается два параметра: карта и исходное состояние уровня. Эта функция ничего не возвращает. Она может использоваться, чтобы инициализировать какие-то переменные, посчитать что-нибудь перед началом игры.  
Функция startGame должна завершить свое выполнение меньше, чем за секунду, иначе уровень не начнется.  
После выполнения функции startGame начинается цикл игры: на каждом ходу вызывается функция getNextCommand, в нее передается текущее состояние уровня. Функция должна вернуть команду для корабля.  
Игра продолжается, пока не наступит одно из следующих событий:  
• прошло 180 ходов с начала игры — победа  
• закончились товары на продажу (ни на корабле, ни в городе не осталось ни одной единицы товара) — победа  
• корабль встал на клетку с пиратами — проигрыш  
• корабль совершил недопустимое действие (двигается по суше, продает товары не в порту, загружает товары не в домашнем порту) — проигрыш  
• произошла ошибка в коде — проигрыш  
• функция getNextCommand не вернула следующую команду за 100 мс — проигрыш  
• При победе счет за уровень равен количеству заработанных денег.  
• При проигрыше счет за уровень равен 0.  

