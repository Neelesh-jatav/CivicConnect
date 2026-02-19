import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter complaint title'],
    trim: true,
    maxLength: [100, 'Complaint title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please enter complaint description'],
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, 'Please select complaint category'],
    enum: {
      values: ['Road', 'Electricity', 'Water', 'Accident', 'Disaster', 'Custom'],
      message: 'Please select correct category for complaint',
    },
  },
  state: {
    type: String,
    required: [true, 'Please select your state'],
  },
  district: {
    type: String,
    required: [true, 'Please enter your district'],
  },
  pincode: {
    type: String,
    required: [true, 'Please enter your pincode'],
    match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode'],
  },
  landmark: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'Pending',
    enum: {
      values: ['Pending', 'Accepted', 'Rejected', 'Allocated to Department', 'Allocated to Officer', 'In Progress', 'Resolved', 'Closed'],
      message: 'Please select correct status for complaint',
    },
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  statusHistory: [
    {
      status: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      assignedDepartment: {
        type: String,
      },
      assignedOfficer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    },
  ],
  department: {
    type: String,
    enum: ['Road', 'Electricity', 'Water', 'Accident', 'Disaster', 'Custom', null],
    default: null,
  },
  officer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  resolutionImages: [
    {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  ],
  finalComments: {
    type: String,
  },
});

export default mongoose.model('Complaint', complaintSchema);
