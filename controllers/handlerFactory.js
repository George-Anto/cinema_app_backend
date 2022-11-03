const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { data: doc },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const { collectionName } = Model.collection;
    let doc;
    let errorMsg;
    // check if id contains something that looks like a valid id
    // default search behaviour, by id.
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      let query = Model.findById(req.params.id);
      if (popOptions) query = query.populate(popOptions);
      doc = await query;
    }

    if (!doc) {
      errorMsg = 'No document found with that ID';
      if (collectionName === 'users') {
        const email = req.params.id;
        // Optional search behaviour only for users collection, by email.
        let query = Model.findOne({ email });
        if (popOptions) query = query.populate(popOptions);
        doc = await query;
        errorMsg += ' or that Email';
      }
    }

    if (!doc) {
      return next(new AppError(errorMsg, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOneStrict = (Model, popOptions, ...roles) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findOne({ _id: req.params.id });
    if (roles.includes(req.user.role)) {
      query = Model.findOne({ _id: req.params.id, user: req.user._id });
    }

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execution plan
    //const doc = await features.query.explain();
    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

exports.getAllStrict = (Model, ...roles) =>
  catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      req.query = { user: req.user._id };
    }
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // Execution plan
    //const doc = await features.query.explain();
    const doc = await features.query.populate({ path: 'invitations' });

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
