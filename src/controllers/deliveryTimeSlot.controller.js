const timeSlotService = require('../services/deliveryTimeSlot.service');

const isValid12HourTime = (value) =>
  /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(String(value || '').trim());

exports.getAllTimeSlots = async (req, res) => {
  try {
    const data = await timeSlotService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTimeSlot = async (req, res) => {
  try {
    if (!isValid12HourTime(req.body.cutoff_time)) {
      return res.status(400).json({ success: false, message: 'Giờ chốt đơn phải có dạng 10:30 AM hoặc 04:00 PM.' });
    }
    await timeSlotService.create(req.body);
    res.status(201).json({ success: true, message: 'Thêm khung giờ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTimeSlot = async (req, res) => {
  try {
    if (!isValid12HourTime(req.body.cutoff_time)) {
      return res.status(400).json({ success: false, message: 'Giờ chốt đơn phải có dạng 10:30 AM hoặc 04:00 PM.' });
    }
    await timeSlotService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTimeSlot = async (req, res) => {
  try {
    await timeSlotService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};