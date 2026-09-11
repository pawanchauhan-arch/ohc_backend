import { Injectable } from '@nestjs/common';
import { sendSuccess, sendError } from 'src/utils/response.util';
import { Bloodgroup } from 'src/models/bloodgroup.model';
import { Bloodpressure } from 'src/models/bloodpressure.model';
import { BMI } from 'src/models/bmi.model';
import { CHOLESTEROL } from 'src/models/cholesterol.model';
import { ECG } from 'src/models/ecg.model';
import { Eyetest } from 'src/models/eyetest.model';
import { Hearingtest } from 'src/models/hearingtest.model';
import { Vision } from 'src/models/vision.model';

@Injectable()
export class TestMasterServiceLMC {
  async hearingTest(req: any, res: any) {
    const { option_1, option_2, option_3 } = req.body;

    const data = {
      option_1,
      option_2,
      option_3,
    };

    let insert;

    try {
      const count = await Hearingtest.count();

      if (count > 0) {
        const existinHearingtest = await Hearingtest.findOne();

        if (existinHearingtest) {
          insert = await existinHearingtest.update(data);
        } else {
          throw new Error('Unexpected: Record not found when it should exist.');
        }
      } else {
        insert = await Hearingtest.create(data);
      }

      sendSuccess(res, 201, insert, 'Hearingtest update successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async bloodGroup(req: any, res: any) {
    let insert;

    const {
      option_1,
      option_2,
      option_3,
      option_4,
      option_5,
      option_6,
      option_7,
      option_8,
    } = req.body;

    const data = {
      option_1,
      option_2,
      option_3,
      option_4,
      option_5,
      option_6,
      option_7,
      option_8,
    };

    try {
      const count = await Bloodgroup.count();

      if (count > 0) {
        const existinBloodgroup = await Bloodgroup.findOne();
        if (existinBloodgroup) {
          insert = await existinBloodgroup.update(data);
        } else {
          throw new Error('Unexpected: Record not found when it should exist.');
        }
      } else {
        insert = await Bloodgroup.create(data);
      }

      sendSuccess(res, 201, insert, 'Bloodgroup update successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }
  async ecgUpdate(req: any, res: any) {
    let insert;

    const { option_1, option_2, option_3, document } = req.body;

    const data = {
      option_1,
      option_2,
      option_3,
      doc: document ? document : null,
    };

    try {
      const count = await ECG.count();

      if (count > 0) {
        const existinECG = await ECG.findOne();
        if (existinECG) {
          insert = await existinECG.update(data);
        } else {
          throw new Error('Unexpected: Record not found when it should exist.');
        }
      } else {
        insert = await ECG.create(data);
      }

      sendSuccess(res, 201, insert, 'ECG update successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async bloodPressure(req: any, res: any) {
    let insert;

    const {
      systolic_standard_value_min,
      systolic_standard_value_max,
      systolic_within_deviation_value_min,
      systolic_within_deviation_value_max,
      systolic_units,
      systolic_out_of_range,

      diastolic_standard_value_min,
      diastolic_standard_value_max,
      diastolic_within_deviation_value_min,
      diastolic_within_deviation_value_max,
      diastolic_units,
      diastolic_out_of_range,

      systolic_within_deviation_value_min_below,
      systolic_within_deviation_value_max_below,
      diastolic_within_deviation_value_min_below,
      diastolic_within_deviation_value_max_below,
      diastolic_out_of_range_below,
      systolic_out_of_range_below,
    } = req.body;

    const data = {
      systolic_standard_value_min,
      systolic_standard_value_max,
      systolic_within_deviation_value_min,
      systolic_within_deviation_value_max,
      systolic_units,
      systolic_out_of_range,

      diastolic_standard_value_min,
      diastolic_standard_value_max,
      diastolic_within_deviation_value_min,
      diastolic_within_deviation_value_max,
      diastolic_units,
      diastolic_out_of_range,

      systolic_within_deviation_value_min_below,
      systolic_within_deviation_value_max_below,
      diastolic_within_deviation_value_min_below,
      diastolic_within_deviation_value_max_below,
      diastolic_out_of_range_below,
      systolic_out_of_range_below,
    };

    try {
      const count = await Bloodpressure.count();

      if (count > 0) {
        const existinBloodpressure = await Bloodpressure.findOne();
        if (existinBloodpressure) {
          insert = await existinBloodpressure.update(data);
        } else {
          throw new Error('Unexpected: Record not found when it should exist.');
        }
      } else {
        insert = await Bloodpressure.create(data);
      }

      sendSuccess(res, 201, insert, 'Bloodpressure update successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async bmiCheck(req: any, res: any) {
    let insert;

    const {
      bmi_standard_value_min,
      bmi_standard_value_max,
      bmi_within_deviation_value_min,
      bmi_within_deviation_value_max,
      bmi_out_of_range,
      bmi_units,

      weight_standard_value_min,
      weight_standard_value_max,
      weight_within_deviation_value_min,
      weight_within_deviation_value_max,
      weight_out_of_range,
      weight_units,

      height_standard_value_min,
      height_standard_value_max,
      height_within_deviation_value_min,
      height_within_deviation_value_max,
      height_out_of_range,
      height_units,
    } = req.body;

    const data = {
      bmi_standard_value_min,
      bmi_standard_value_max,
      bmi_within_deviation_value_min,
      bmi_within_deviation_value_max,
      bmi_out_of_range,
      bmi_units,

      weight_standard_value_min: weight_standard_value_min,
      weight_standard_value_max,
      weight_within_deviation_value_min,
      weight_within_deviation_value_max,
      weight_out_of_range,
      weight_units,

      height_standard_value_min,
      height_standard_value_max,
      height_within_deviation_value_min,
      height_within_deviation_value_max,
      height_out_of_range,
      height_units,

      bmi_within_deviation_value_min_below:
        req.body.bmi_within_deviation_value_min_below,
      bmi_within_deviation_value_max_below:
        req.body.bmi_within_deviation_value_max_below,
      bmi_out_of_range_below: req.body.bmi_out_of_range_below,
    };

    console.log(data);

    try {
      const count = await BMI.count();

      if (count > 0) {
        const existinBMI = await BMI.findOne();
        if (existinBMI) {
          insert = await existinBMI.update(data);
        } else {
          throw new Error('Unexpected: Record not found when it should exist.');
        }
      } else {
        insert = await BMI.create(data);
      }

      sendSuccess(res, 201, insert, 'BMI update successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }
  async cholesterolUpdate(req: any, res: any) {
    let insert;

    const {
      total_cholesterol_standard_value_min,
      total_cholesterol_standard_value_max,
      total_cholesterol_within_deviation_value_min,
      total_cholesterol_within_deviation_value_max,
      total_cholesterol_out_of_range,
      total_cholesterol_units,

      ld_cholesterol_standard_value_min,
      ld_cholesterol_standard_value_max,
      ld_cholesterol_within_deviation_value_min,
      ld_cholesterol_within_deviation_value_max,
      ld_cholesterol_out_of_range,
      ld_cholesterol_units,

      hd_cholesterol_standard_value_min,
      hd_cholesterol_standard_value_max,
      hd_cholesterol_within_deviation_value_min,
      hd_cholesterol_within_deviation_value_max,
      hd_cholesterol_out_of_range,
      hd_cholesterol_units,
    } = req.body;

    const data = {
      total_cholesterol_standard_value_min,
      total_cholesterol_standard_value_max,
      total_cholesterol_within_deviation_value_min,
      total_cholesterol_within_deviation_value_max,
      total_cholesterol_out_of_range,
      total_cholesterol_units,

      ld_cholesterol_standard_value_min,
      ld_cholesterol_standard_value_max,
      ld_cholesterol_within_deviation_value_min,
      ld_cholesterol_within_deviation_value_max,
      ld_cholesterol_out_of_range,
      ld_cholesterol_units,

      hd_cholesterol_standard_value_min,
      hd_cholesterol_standard_value_max,
      hd_cholesterol_within_deviation_value_min,
      hd_cholesterol_within_deviation_value_max,
      hd_cholesterol_out_of_range,
      hd_cholesterol_units,
    };

    try {
      const count = await CHOLESTEROL.count();

      if (count > 0) {
        const existiCHOLESTEROL = await CHOLESTEROL.findOne();
        if (existiCHOLESTEROL) {
          insert = await existiCHOLESTEROL.update(data);
        } else {
          throw new Error('Unexpected: Record not found when it should exist.');
        }
      } else {
        insert = await CHOLESTEROL.create(data);
      }

      sendSuccess(res, 201, insert, 'CHOLESTEROL update successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async viewEyeTest(req: any, res: any) {
  try {
    const data = await Eyetest.findOne({
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}

async viewBloodgroup(req: any, res: any) {
  try {
    const data = await Bloodgroup.findOne({
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}
async viewHearingtest(req: any, res: any) {
  try {
    const data = await Hearingtest.findOne({
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}

async viewECG(req: any, res: any) {
  try {
    const data = await ECG.findOne({
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}
async viewBloodpressure(req: any, res: any) {
  try {
    const data = await Bloodpressure.findOne({
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}


async viewBMI(req: any, res: any) {
  try {
    const data = await BMI.findOne({
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}
async viewCholesterol(req: any, res: any) {
  try {
    const data = await CHOLESTEROL.findOne({
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}

async updateEyeTest(req: any, res: any) {
  try {
    const {
      spherical_right_within_deviation_value_min_below,
      spherical_right_within_deviation_value_min,
      spherical_right_out_of_range_below,
      spherical_right_out_of_range,
      cylindrical_right_within_deviation_value_min_below,
      cylindrical_right_within_deviation_value_min,
      cylindrical_right_out_of_range_below,
      cylindrical_right_out_of_range,
      spherical_left_within_deviation_value_min_below,
      spherical_left_within_deviation_value_min,
      spherical_left_out_of_range_below,
      spherical_left_out_of_range,
      cylindrical_left_within_deviation_value_min_below,
      cylindrical_left_within_deviation_value_min,
      cylindrical_left_out_of_range_below,
      cylindrical_left_out_of_range,
      colour_blindness_option_1,
      colour_blindness_option_2,
    } = req.body;

    const data = {
      spherical_right_within_deviation_value_min_below,
      spherical_right_within_deviation_value_min,
      spherical_right_out_of_range_below,
      spherical_right_out_of_range,
      cylindrical_right_within_deviation_value_min_below,
      cylindrical_right_within_deviation_value_min,
      cylindrical_right_out_of_range_below,
      cylindrical_right_out_of_range,
      spherical_left_within_deviation_value_min_below,
      spherical_left_within_deviation_value_min,
      spherical_left_out_of_range_below,
      spherical_left_out_of_range,
      cylindrical_left_within_deviation_value_min_below,
      cylindrical_left_within_deviation_value_min,
      cylindrical_left_out_of_range_below,
      cylindrical_left_out_of_range,
      colour_blindness_option_1,
      colour_blindness_option_2,
    };

    let insert;

    try {
      const count = await Eyetest.count();

      if (count > 0) {
        const existinEyetest = await Eyetest.findOne();
        if (existinEyetest) {
          insert = await existinEyetest.update(data);
        } else {
          throw new Error(
            'Unexpected: Record not found when it should exist.',
          );
        }
      } else {
        insert = await Eyetest.create(data);
      }

      sendSuccess(res, 201, insert, 'EyeTest update successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}


async VisionTestUpdate(req: any, res: any) {
  try {
    const { left_eye_options, right_eye_options } = req.body;
    if (!Array.isArray(left_eye_options) || !Array.isArray(right_eye_options)) {
      return sendError(res, 400, 'left_eye_options and right_eye_options must be arrays');
    }
    if (left_eye_options.length !== 7 || right_eye_options.length !== 7) {
      return sendError(res, 400, 'left_eye_options and right_eye_options must have 7 values');
    }
    const hasInvalidLeftOption = left_eye_options.some(
      (option: any) => typeof option !== 'string' || option.trim() === '',
    );
    const hasInvalidRightOption = right_eye_options.some(
      (option: any) => typeof option !== 'string' || option.trim() === '',
    );
    if (hasInvalidLeftOption || hasInvalidRightOption) {
      return sendError(res, 400, 'all eye options must be non-empty strings');
    }
    const normalizedLeftEyeOptions = left_eye_options.map((option: string) => option.trim());
    const normalizedRightEyeOptions = right_eye_options.map((option: string) => option.trim());
    const [
      resolvedOption1,
      resolvedOption2,
      resolvedOption3,
      resolvedOption4,
      resolvedOption5,
      resolvedOption6,
      resolvedOption7,
    ] = normalizedLeftEyeOptions;

    const data = {
      option_1: resolvedOption1,
      option_2: resolvedOption2,
      option_3: resolvedOption3,
      option_4: resolvedOption4,
      option_5: resolvedOption5,
      option_6: resolvedOption6,
      option_7: resolvedOption7,
      left_eye_options: normalizedLeftEyeOptions,
      right_eye_options: normalizedRightEyeOptions,
    };

    let insert;

    try {
      const count = await Vision.count();

      if (count > 0) {
        const existinVision = await Vision.findOne({ order: [['id', 'DESC']] });
        if (existinVision) {
          insert = await existinVision.update(data);
        } else {
          throw new Error(
            'Unexpected: Record not found when it should exist.',
          );
        }
      } else {
        insert = await Vision.create(data);
      }

      sendSuccess(res, 201, insert, 'Vision update successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}

async VisionTestView(req: any, res: any) {
  try {
    const data = await Vision.findOne({
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    if (!data) {
      return sendSuccess(res, 200, data, 'Success');
    }
    const fallbackEyeOptions = [
      data.option_1,
      data.option_2,
      data.option_3,
      data.option_4,
      data.option_5,
      data.option_6,
      data.option_7,
    ];
    const responseData = {
      left_eye_options: data.left_eye_options ?? fallbackEyeOptions,
      right_eye_options: data.right_eye_options ?? fallbackEyeOptions,
    };
    sendSuccess(res, 200, responseData, 'Success');
  } catch (error) {
    sendError(res, 500, 'internal server error');
  }
}


}
