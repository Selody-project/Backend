import moment from 'moment';
import personalSchedule from '../models/personalSchedule';
import User from '../models/user';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/calendar/NotFound';
import { UserNotFoundError, DataFormatError } from '../errors';
import { validateUserScheduleSchema, validateScheduleIdSchema } from '../utils/validators';

async function postPersonalSchedule(req, res, next) {
  try {
    const { error } = validateUserScheduleSchema(req.body);
    
    if (error) {
      return next(new DataFormatError());
    }

    const {
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;

    const user = await User.findOne({ where: { nickname: req.nickname } });
    
    if (!user) {
      return next(new UserNotFoundError());
    }

    const { userId } = user;
    
    await personalSchedule.create({
      userId,
      title,
      content,
      startDateTime: moment.utc(startDateTime).format('YYYY-MM-DD HH:mm:ss'),
      endDateTime: moment.utc(endDateTime).format('YYYY-MM-DD HH:mm:ss'),
      recurrence,
      freq,
      interval,
      byweekday,
      until,
    });

    return res.status(201).json({ message: 'Successfully create user schedule' });
  } catch (error) {
    return next(new ApiError());
  }
}

async function deletePersonalSchedule(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    
    if (error) return next(new DataFormatError());

    const { id } = req.params;

    const data = await personalSchedule.destroy({ where: { id } });
    
    if (data === 0) {
      return next(new NotFoundError());
    }

    return res.status(204).json({ message: 'successfully deleted' });
  } catch (error) {
    return next(new ApiError());
  }
}

export {
  postPersonalSchedule,
  deletePersonalSchedule,
};
