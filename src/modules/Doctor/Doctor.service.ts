import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Doctor } from '../../models/Doctor';
import { User } from '../../models/User';
import { Consultation } from '../../models/Consultation'; // Import Consultation model

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor)
    private doctorModel: typeof Doctor,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Consultation)
    private consultationModel: typeof Consultation, // Inject Consultation model
  ) {}

  // Updated method to include doctor name from User table
  async getDoctorByPhoneNumber(phoneNumber: string): Promise<Doctor & { name?: string }> {
    console.log('Service - Phone Number:', phoneNumber);

    const doctor = await this.doctorModel.findOne({
      where: { contact_number: phoneNumber },
      include: [
        {
          model: this.userModel,
          as: 'user',
          attributes: ['username', 'id', 'status'], // Include status for active/inactive check
        },
      ],
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with phone number ${phoneNumber} not found`,
      );
    }

    // Block inactive doctors from proceeding (doctor app login relies on this endpoint)
    if (doctor.user && doctor.user.status === false) {
      throw new ForbiddenException('account_inactive');
    }

    // Debug logging
    console.log('Doctor user_id:', doctor.user_id);
    console.log('Doctor user object:', JSON.stringify(doctor.user, null, 2));

    // Create a response object that includes the doctor data and the name from the user
    const response = doctor.toJSON();
    
    // Check if user exists and has a name property
    if (doctor.user && doctor.user.username) {
      response.name = doctor.user.username;
      console.log('Setting doctor name to:', doctor.user.username);
    } else {
      // If user relation is not loaded properly, try to fetch the user directly
      console.log('User relation not loaded properly, fetching user directly');
      try {
        const user = await this.userModel.findByPk(doctor.user_id);
        if (user && user.username) {
          response.name = user.username;
          console.log('Retrieved name from direct user query:', user.username);
        } else {
          console.log('User not found or name is null for user_id:', doctor.user_id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }

    return response;
  }

  // New method to fetch consultations for a doctor and sort by scheduled_time
  async getConsultationsByDoctorId(doctorId: number): Promise<Consultation[]> {
    console.log('Service - Doctor ID:', doctorId);

    // Fetch consultations for the specific doctor and sort by scheduled_time descending
    const consultations = await this.consultationModel.findAll({
      where: { doctor_id: doctorId },
      order: [['scheduled_time', 'DESC']], // Sorting by latest time
    });

    if (!consultations || consultations.length === 0) {
      throw new NotFoundException(
        `No consultations found for doctor with ID ${doctorId}`,
      );
    }

    return consultations;
  }
}
