import { uploadToCloudinary } from './cloudinary.js';

export const processDayFiles = async (days, files) => {
  const fileMap = {};
  files.forEach(file => {
    // Support fieldname patterns:
    // dayIndex-section-field (e.g., 0-breakfast-images)
    // dayIndex-activity-field-activityIndex (e.g., 0-activity-images-1)
    const parts = file.fieldname.split('-');
    const dayIndex = parts[0];
    const section = parts[1];

    if (!fileMap[dayIndex]) fileMap[dayIndex] = {};
    
    if (section === 'activity') {
      const field = parts[2];
      const activityIndex = parts[3];
      if (!fileMap[dayIndex].activities) fileMap[dayIndex].activities = {};
      if (!fileMap[dayIndex].activities[activityIndex]) fileMap[dayIndex].activities[activityIndex] = {};
      fileMap[dayIndex].activities[activityIndex][field] = file;
    } else {
      const field = parts[2];
      if (!fileMap[dayIndex][section]) fileMap[dayIndex][section] = {};
      fileMap[dayIndex][section][field] = file;
    }
  });

  return Promise.all(days.map(async (day, index) => {
    const dayFiles = fileMap[index] || {};

    // Process meals
    for (const mealType of ['breakfast', 'lunch', 'dinner']) {
      if (dayFiles[mealType]) {
        const mealFiles = dayFiles[mealType];
        if (mealFiles.images) {
          const result = await uploadToCloudinary(mealFiles.images.buffer, {
            folder: `trips/meals/${mealType}`
          });
          if (!day.meals) day.meals = {};
          if (!day.meals[mealType]) day.meals[mealType] = { images: [], videos: [] };
          day.meals[mealType].images.push(result.secure_url);
        }
        if (mealFiles.videos) {
          const result = await uploadToCloudinary(mealFiles.videos.buffer, {
            resource_type: 'video',
            folder: `trips/meals/${mealType}`
          });
          if (!day.meals) day.meals = {};
          if (!day.meals[mealType]) day.meals[mealType] = { images: [], videos: [] };
          day.meals[mealType].videos.push(result.secure_url);
        }
      }
    }

    // Process hotel
    if (dayFiles.hotel) {
      const hotelFiles = dayFiles.hotel;
      if (hotelFiles.images) {
        const result = await uploadToCloudinary(hotelFiles.images.buffer, {
          folder: 'trips/hotels'
        });
        if (!day.hotel) day.hotel = { images: [], pdfUrl: '' };
        day.hotel.images.push(result.secure_url);
      }
      if (hotelFiles.pdfUrl) {
        const result = await uploadToCloudinary(hotelFiles.pdfUrl.buffer, {
          resource_type: 'raw',
          folder: 'trips/hotels/documents'
        });
        if (!day.hotel) day.hotel = { images: [], pdfUrl: '' };
        day.hotel.pdfUrl = result.secure_url;
      }
    }

    // Process activities
    if (Array.isArray(day.activities) && dayFiles.activities) {
      day.activities = await Promise.all(day.activities.map(async (activity, idx) => {
        const activityFiles = dayFiles.activities[idx] || {};
        if (activityFiles.images) {
          const result = await uploadToCloudinary(activityFiles.images.buffer, {
            folder: `trips/activities/images`
          });
          if (!activity.images) activity.images = [];
          activity.images.push(result.secure_url);
        }
        if (activityFiles.videos) {
          const result = await uploadToCloudinary(activityFiles.videos.buffer, {
            resource_type: 'video',
            folder: `trips/activities/videos`
          });
          if (!activity.videos) activity.videos = [];
          activity.videos.push(result.secure_url);
        }
        return activity;
      }));
    }

    return day;
  }));
};