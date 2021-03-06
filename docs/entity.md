---
layout: default
title: Сущность
nav_order: 6
---

# KateJS - Сущность

Сущность является структурной единицей серверного приложения
и представляет собой класс с набором методов, которые вызываются
через `API` клиентским приложением или из других сущностей.

Сущность оформляется классом в синтаксисе `ES6` для возможности
использования наследования для расширения фукнциональности.

## Работа с сущностью
В минимальном виде сущность может быть просто классом со своими методами.

````
export default class Test {
  constructor(args) {
    Object.assign(this, args); // save app, logger to 'this'
  }  
  test() {
    console.log('This is test method of entity Test');
  }
}
````

Данный метод может быть вызван, например, со стороны клиента из формы или из
другой сущности.
````
  this.app.Test.test();
````

При вызове через api в параметры метода передается объект содержащий контекст запроса 
и переденные со соторны клиента параметры
````
  test({ ctx, data }) {

  }
````
- `ctx` - контекст http запроса [koa ctx](https://koajs.com/#context)
- `data` - переданные со стороны клиента параметры

При создании метдов предназначенных для вызова как через api так и со стороны
сервера из других сущностей следует либо передавать `ctx` при вызове либо
учитывать что его может не быть.

При работе через api метод должен возращать объект с одним из полей `response` или `error`.
При наличии поля `response` оно будет возвращено с успешным статусом (200). 
При отсутствии поля `response` будет возвращено поле `error`.

В поле error можно передать объект с полем status значение которого будет использовано
в качестве http статуса. По умолчанию будет использован статус 500 (Internal server error)
````
  test({ ctx, data }) {
    if (data.uuid) {
      return { response: { uuid: data.uuid }};
    }
    return { error: { status: 404, message: 'no uuid' }};
  }
````

## Работа с СУБД

Сущность может быть связана с данными, хранимыми в субд. 

После создания экземпляра класса сущности `kate` смотрит на наличие поля
`structure` в созданном экземпляре и при их наличии создает `модель`
для работы с СУБД. 

При необходимости работы с СУБД необходимо установить в это поле
требуемый элемент структуры. 

В минимальном виде класс сущности предоставляющий методы работы с СУБД
выглядит так:
````
import { Entity } from 'katejs';
import { structures } from '../structure';


export default class Template extends Entity {
  constructor(params) {
    super(params);
    this.structure = structures.Template;
  }
}
````
В коде `серверного приложения`, при использовании вызова `makeEntitiesFromStructures`
классы сущностей создаются именно в таком виде.

### Методы класса Entity

При создании сущности с помощью метода `makeEntitiesFromStructures` или наследованием от `Entity`
класс получает следующие методы.

`async get({ data: { uuid }, transaction, lock })` - получение данных о записи из СУБД
Параметры:
- `uuid` - идентификатор записи.

Возвращает: `{ response, error }`
- `response` - данные в JSON формате с разрешенными связями, включая таблицы
- `error` - ошибка


`async put({ data: { uuid, body }, transaction })` - запись данных в СУБД
Параметры:
- `uuid` - идентификатор записи данные которой надо обновить. При отсутствии будет создана новая запись.
- `body` - данные записи

Возвращает: `{ response, error }`
- `response` - обновленные или созданные данные записи в JSON формате с разрешенными связями, включая таблицы
- `error` - ошибка


`async delete({ data: { uuid }, transaction })` - удаление записи из СУБД
Параметры:
- `uuid` - идентификатор записи которую нужно удалить

Возвращает: `{ response, error }`
- `response` - объект `{ ok: true }`, если удаление прошло успешно
- `error` - ошибка

`async query({ data: { where, attributes }, transaction, lock })` - получение списка записей из СУБД
Параметры:
- `where`, `attribures` - параметры выборки в формате [Sequelize](http://docs.sequelizejs.com/manual/tutorial/querying.html). 
Операторы записываются в виде строковых ключей в виде `$or`, `$and`, `$gt` и т.п.

Возвращает: `{ response, error }`
- `response` - массив записей из СУБД
- `error` - ошибка

`async transaction()` - старт транзакции
Возвращает
- `transaction` - объект транзации.

### Произвольный SQL запрос
При необходимости произвольного запроса, воспользуйтесь методом
`rawQuery` серверного приложения
````
  const result = await this.app.rawQuery('SELECT * from Tasks;');
````


### Обработчики класса Entity
Если класс, наследуемый от `Entity` определит соответствующий метод, 
то тот будет вызван из основных методов класса `Entity`. 
Обработчики позволяют реализовать дополнительный
функционал без переопределения базовых методов.
- `async beforePut({ savedEntity, body, transaction, ctx })` - вызывается в процессе работы
метода `put` до записи в базу данных. В метод передается сохраненный в базе объект,
при его наличии, новые данные, транзакция и контекст запроса. Если в методе будет
вызвано исключение, то запись в базу данный произведена не будет.
`uuid` сущности можно взять из `savedEntity`, а если этого объекта
нет, значит идет создание сущности и `uuid` еще не присвоен.
- `async afterPut({ entity, transaction, ctx })` - вызывается в процессе работы
метода `put` после записи в базу данных но до завершения транзакции. В метод
передается созданный/измененный объект, транзакция и контекст запроса.
`ctx.state.savedEntity` содержит объект до изменений, если он есть.
- `afterInit()` - вызывается сразу после инициализации объекта. В этом методе можно
инициализировать кэш, обратиться к СУБД и т.п.

### Транзакции

В системе есть возможность использовать транзакции. 
Для этого необходимо создать транзакцию,
передать ее во все вызовы методом сущности, зафиксировать или отменить.

Методы `get`, `query` будут использовать транзакцию и блокировку 
если они переданы как параметр.

Методы `put`, `delete` будут использовать переданную транзакцию или 
создавать и завершать свою, если транзакция не передана.
````
  async someAction({ ctx, data: { uuid } }) {
    const transaction = await this.transaction();
    try {
      const { response: item } =
        await this.get({ data: { uuid }, transaction, lock: transaction.LOCK.UPDATE });

      item.readedBy.push({
        user: ctx.state.user,
      });

      const result = await this.put({ data: { uuid, body: item }, transaction });
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      return { error };
    }
  }
````

### Варианты условий в выборке записей Entity.query
Выборка записей включает связанные таблицы, поэтому есть возможность
выбирать с уловиями на вложенные поля.

Упорядочить по атрибуту ссылочного поля
````
const order = [['district', 'title']];
````

Для агрегирования данных можно использовать метод query
используя вспомогательные ключи `$func` и `$col` как способ
указания `Sequelize.fn` и `Sequelize.col`.

Пример: запрос по сущности `Order` по таблице `products` c числовыми
полями `amount`, `sum` и ссылочным `product`.
````
        attributes: [
          [{ $func: { fn: 'SUM', col: 'products.amount' } }, 'amount'],
          [{ $func: { fn: 'SUM', col: 'products.sum' } }, 'sum'],
        ],
        group: [{ $col: 'products->product.uuid' }],
        order: [{ $col: 'products->product.title' }],
````

Для ручного указания SQL функции для атрибута (при комбинировании двух функций, например)
можно использовать ключ `literal` как способ указания `Sequelize.literal`.

Данная фукнциональность доступна только со стороны сервера для исключения
SQL инъекций.
````
import { literal } from 'katejs/lib/Entity';

...
    attributes: [
      [{ [literal]: 'COUNT(DISTINCT(news.uuid))' }, 'count'],
    ],
````

При выборке вложенных полей необходимо указать путь через `.` внутри `$$`.

````
const where = { '$role.title$': { $like: '%Admin%' } };
````

Выборка по условию на элемент в табличной части сущности:
````
// select users by specific role
const where = { '$roles.role.uuid$': role.uuid };
````

При отсутствии необходимости использования в запросе 
вложенных таблиц (ссылки, таб. части)
следует передать параметр `noOption = true`
````
  const { response, error } = await this.app.User.query({
      data: {
        noOptions: true,
        attributes: [
          [{ [literal]: 'COUNT(DISTINCT(districtUuid))' }, 'count'],
        ],
      },
    });

````

Важно. При использовании условия на таблицы сущности или атрибуты ссылочных полей 
фреймворк не будет использовать лимит для пагинации. 
Такой лимит в этом случае не имеет смысла, так как для отработки условия
на поля табличной части происходит ее соединение с основной таблицей
и на каждую сущность получается несколько строк 
(столько сколько записей в табличной части) и параметр `limit` влияет
на общее кол-во строк в выборке, а не на количество сущностей.

При необходимости пагинации с условием на атрибут табличной части
можно указать это условие через вложенный запрос используя `literal`
````
  // select users by specific role
  const where = {
    [literal]: `\`uuid\` IN (SELECT userUuid FROM userroles WHERE roleUuid = '${role.uuid}')`,
  };
````

