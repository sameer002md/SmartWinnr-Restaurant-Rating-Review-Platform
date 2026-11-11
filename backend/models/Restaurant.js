
import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Restaurant name is required"],
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        location: {
            type: String,
            required: [true, "Restaurant location is required"],
            trim: true
        },

        cuisine: {
            type: String,
            required: [true, "Cuisine is required"],
            trim: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes to support restaurant search and filtering
restaurantSchema.index({ name: "text" });
restaurantSchema.index({ location: 1, cuisine: 1 });
restaurantSchema.index({ owner: 1 });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
