'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: Array,
            reviews: [{
                id: String,
                login: String,
                date: Date,
                text: String,
                rating: Number,
                isApproved: Boolean
            }],
            name: String,
            image: String,
            price: Number,
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [{
                souvenirId: { type: mongoose.Schema.Types.ObjectId, ref: 'Souvenir' },
                amount: {
                    type: Number,
                    unique: true
                }
            }],
            login: String
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Далее идут методы, которые вам необходимо реализовать:

    async getAllSouvenirs() {
        // Данный метод должен возвращать все сувениры
        return await this._Souvenir.find({});
    }

    async getCheapSouvenirs(price) {
        return await this._Souvenir.find({ 'price': { $lt: price } });
    }

    async getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
        return await this._Souvenir.find({}).sort({ 'rating': -1 })
            .limit(n);
    }

    async getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return await this._Souvenir.find({ 'tags': { $in: [tag] } })
            .select('name image price -_id');
    }

    async getSouvenirsCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return await this._Souvenir.count({ 'country': country, 'rating': { $gt: rating },
            'price': { $lte: price } });
    }

    async searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return await this._Souvenir.find({ 'name': { '$regex': `^.*${substring}.*$` } });
    }

    async getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        return await this._Souvenir.find({ 'reviews.0.date': { $gt: date } });
    }

    async deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)

        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
        let result = await this._Souvenir.find({ 'amount': 0 })
            .remove();

        return result.ok === 1 ? { ok: 1, n: result.n } : null;
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        const review = { login: login, rating: rating, text: text,
            isApproved: false, date: new Date() };
        const souvenir = await this._Souvenir.findOne({ _id: souvenirId });
        const newRating = (souvenir.reviews.reduce((a, b) => a + b.rating, 0) + rating) /
            (souvenir.reviews.length + 1);
        await this._Souvenir.update({ _id: souvenirId }, { $push: { 'reviews': review },
            $set: { 'rating': newRating } });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const cart = await this._Cart.findOne({ login: login });
        const sum = cart.items.reduce((a, b) => a + b.amount, 0);

        return sum;
    }
};
