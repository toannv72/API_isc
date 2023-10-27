const User = require('../models/User');
const Token = require('../../config/db/config');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
class UserController {
    put(req, res, next) {
        console.log(req.body);
        User.findByIdAndUpdate(req.params.id,
            req.body)
            .then((product => {
                if (!product) {
                    return res.status(404).send({ error: 'User not found' })

                }
                res.json(product)
            }
            ))
            .catch(next =>
                res.json(next)
            )
    }


    trash(req, res, next) {
        User.findDeleted()
            .then(courses =>
                res.json(courses))
            .catch(next)
    }
    countByRole(req, res, next) {
        req.params.role
        User.aggregate([
            {
                $match: { role: req.params.role } // Chỉ lấy người dùng có vai trò là "user"
            },
            {
                $group: {
                    _id: '$role', // Nhóm theo trường 'role'
                    totalUsers: { $sum: 1 } // Đếm số lượng người dùng trong nhóm
                }
            }
        ]).then((result) => {
            res.json(result);
        }).catch((error) => {
            console.error(error);
            res.status(500).json({ error: 'Could not retrieve the user count.' });
        });
    }

    changePassword(req, res, next) {
        const formData = req.body

        var checkTokenValid = jwt.verify(req.cookies.accessToken, Token.refreshToken);

        User.findById(checkTokenValid.user._id)
            .then((user) => {

                bcrypt.compare(formData.password, user.password, function (err, check) {

                    console.log(1111111111111, check);
                    if (check) {
                        var salt = bcrypt.genSaltSync(10);
                        var hash = bcrypt.hashSync(formData.newPassword, salt);
                        formData.newPassword = hash

                        User.findByIdAndUpdate(checkTokenValid.user._id, { password: formData.newPassword }, { new: true })
                            .then(courses => {
                                var token = jwt.sign({ user }, Token.refreshToken);
                                res.cookie("accessToken", token);
                                return res.json({ ...courses, accessToken: token })

                            })
                            .catch(next => {
                                res.json(next)
                            })

                    } else {
                        return res.status(401).send({
                            error: "Incorrect password",
                        })
                    }
                });

            })
            .catch(next => {

                res.status(500).json(next)

            })


    }

    restore(req, res, next) {
        User.restore({ _id: req.params.id })
            .then(() => {
                User.findByIdAndUpdate(req.params.id,
                    // req.body
                    {
                        "deleted": false
                    }
                )
                    .then((e) => res.json(e))
                    .catch(next)
            })
            .catch(next)

    }
    search(req, res, next) {
        function escapeRegExp(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        }
        const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là trang 1
        const limit = parseInt(req.query.limit) || 10; // Số lượng phần tử trên mỗi trang, mặc định là 10
        const formData = req.query.name
        const escapedSearchTerm = escapeRegExp(formData);

        const options = {
            page: page,
            limit: 5,

            // tùy chọn xác định cách sắp xếp và so sánh trong truy vấn.
            collation: {
                locale: 'en',
            },
        };
        if (formData === "") {

            User.find({})
                .then((movies) => {
                    res.json({ "movie": [movies] })
                })
                .catch(next)
        } else {

            User.paginate({ name: { $regex: escapedSearchTerm } }, options, function (err, result) {

                if (result.totalPages < result.page) {
                    const options1 = {
                        page: result.totalPages,
                        limit: 5,

                        // tùy chọn xác định cách sắp xếp và so sánh trong truy vấn.
                        collation: {
                            locale: 'en',
                        },
                    };
                    User.paginate({ name: { $regex: escapedSearchTerm } }, options1, function (err, data) {


                        return res.json(
                            {
                                movie: (data.docs),
                                totalPages: data.totalPages,
                                page: result.totalPages,
                                prevPage: data.prevPage,
                                nextPage: data.nextPage,
                                totalDocs: data.totalDocs,
                                search: formData
                            })

                    })

                } else {

                    return res.json(
                        {
                            movie: (result.docs),
                            totalPages: result.totalPages,
                            page: result.page,
                            prevPage: result.prevPage,
                            nextPage: result.nextPage,
                            totalDocs: result.totalDocs,
                            search: formData
                        })
                }
            });
        }


    }

    post(req, res, next) {
        const formData = req.body
        const course = new User(formData)
        course.save()
            .then(() => res.json(req.body))
            .catch((error) => {
                res.json(error)
            })

        // res.send(`oke`)
    }

    get(req, res, next) {
        const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là trang 1
        const limit = parseInt(req.query.limit) || 100; // Số lượng phần tử trên mỗi trang, mặc định là 10
        const options = {
            page: page,
            limit: limit,
            // tùy chọn xác định cách sắp xếp và so sánh trong truy vấn.
            collation: {
                locale: 'en',
            },
        };
        User.paginate({}, options, function (err, result) {
            res.json(result)
        })
    }

    getOne(req, res, next) {

        User.findById(req.params.id)
            .then((data => res.json(data)))
            .catch(err => res.status(err))
    }

    delete(req, res, next) {
        User.findById(req.params.id)
            .then((data => {
                console.log(1111111111111111,data.role)
                if (data.role==='admin') {
                    res.status(500).json({ error: 'Không thể xóa tài khoản này' })
                } else {
                    User.delete({ _id: req.params.id })
                        .then((User => {
                            res.send(User)
                        }))
                        .catch(error => res.status(500).json({ error: 'Could not retrieve User.' }))
                }
            }))
            .catch(err => res.status(err))


    } catch(error) {
        res.status(500).json(error);

    }



}
module.exports = new UserController;
