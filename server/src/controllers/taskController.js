const Task = require("../models/Task");

const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    return res.status(200).json(tasks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, completed, author } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const task = await Task.create({
      title,
      description,
      completed: completed || false,
      author: author || req.user._id
    });

    return res.status(201).json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};