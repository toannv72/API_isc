const Product = require("../models/Product");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const UserController = require("./UserController");
var jwt = require('jsonwebtoken');
const Token = require('../../config/db/config');



class FeedbackController {


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
        Feedback.paginate({}, options, function (err, result) {
            res.json(result)
        })
    }


    post(req, res, next) {
        try {
            var checkTokenValid = jwt.verify(req.cookies.accessToken, Token.refreshToken);

            const formData = req.body;
           
            const newFeedback = new Feedback({...formData,  user: checkTokenValid.user._id,});
            // Lưu đánh giá vào cơ sở dữ liệu
            newFeedback.save()
                .then((rating) => {
                    return res.json(rating)

                })
                .catch((error) => {
                    return res.status(500).json(error);

                })

            // Trả về đánh giá đã tạo thành công
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Could not create the rating.' });
        }

    }

    put(req, res, next) {
        Feedback.findByIdAndUpdate(req.params.id,
            req.body,{ new: true })
            .then((product => {
                res.json(product)
            }
            ))
            .catch(next =>
                res.json(next)
            )

    }

    getProduct(req, res, next){

        Feedback.find({products:req.params.id} )
        .then((data => res.json(data)))
        .catch(err =>res.status(err))
    }

    getOne(req, res, next){

        Feedback.findById(req.params.id )
        .then((data => res.json(data)))
        .catch(err =>res.status(err))
    }

    delete(req, res, next) {
        Feedback.delete({ _id: req.params.id })
            .then((User => {
                res.send(User)
            }
            ))
            .catch(error => res.status(500).json({ error: 'Could not retrieve Feedback.' }))

    } catch(error) {
        res.status(500).json(error);

    }

    // delete(req, res, next) {
    //     try {
    //         const { id } = req.params; // Lấy ID của đánh giá từ URL

    //         // Tìm đánh giá theo ID
    //         const rating = Feedback.findById(id);
    //         if (!rating) {
    //             return res.status(404).json({ error: 'Feedback not found.' });
    //         }

    //         // Kiểm tra xem người dùng có quyền xóa đánh giá không
    //         if (rating.user.toString() !== req.user._id.toString()) {
    //             return res.status(403).json({ error: 'You do not have permission to delete this rating.' });
    //         }

    //         // Xóa đánh giá
    //         rating.remove();

    //         // Trả về thông báo xóa thành công
    //         res.json({ message: 'Feedback deleted successfully.' });
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ error: 'Could not delete the rating.' });
    //     }

    // }

}
module.exports = new FeedbackController;
