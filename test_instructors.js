const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'env', '.env.dev'), override: true });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInstructors() {
  console.log('🔍 Checking instructors table...\n');

  try {
    // Check existing instructors
    const { data: existingInstructors, error: fetchError } = await supabase
      .from('instructors')
      .select('*')
      .order('last_name');

    if (fetchError) {
      console.error('❌ Error fetching instructors:', fetchError);
      return;
    }

    console.log(`✅ Found ${existingInstructors.length} instructors in database\n`);

    if (existingInstructors.length > 0) {
      console.log('📋 Existing Instructors:');
      existingInstructors.forEach((instructor, index) => {
        console.log(`   ${index + 1}. ${instructor.first_name} ${instructor.last_name}`);
        console.log(`      Email: ${instructor.email}`);
        console.log(`      Specialties: ${instructor.specialties ? instructor.specialties.join(', ') : 'None'}`);
        console.log(`      Status: ${instructor.status}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No instructors found. Creating test data...\n');

      const testInstructors = [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@vikinghammer.com',
          phone: '+994501234567',
          specialties: ['CrossFit', 'Strength Training', 'Olympic Lifting'],
          certifications: ['CrossFit Level 2 Trainer', 'USA Weightlifting Level 1', 'CPR Certified'],
          bio: '8+ years of coaching experience specializing in Olympic lifting and CrossFit methodology. Former competitive athlete with a passion for helping others reach their fitness goals.',
          years_experience: 8,
          avatar_url: null,
          availability: ['Monday', 'Wednesday', 'Friday'],
          status: 'active'
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@vikinghammer.com',
          phone: '+994501234568',
          specialties: ['Yoga', 'Pilates', 'Mobility'],
          certifications: ['Registered Yoga Teacher (RYT-200)', 'Pilates Instructor', 'Functional Movement Specialist'],
          bio: 'Certified yoga and pilates instructor focusing on flexibility, core strength, and injury prevention. Specializes in working with athletes to improve mobility and recovery.',
          years_experience: 5,
          avatar_url: null,
          availability: ['Tuesday', 'Thursday', 'Saturday'],
          status: 'active'
        },
        {
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike.johnson@vikinghammer.com',
          phone: '+994501234569',
          specialties: ['HIIT', 'Cardio', 'Boxing'],
          certifications: ['Personal Trainer Level 3', 'Boxing Coach', 'Nutrition Specialist'],
          bio: 'High-intensity interval training specialist with background in competitive boxing. Focuses on fat loss, cardiovascular endurance, and functional fitness for everyday life.',
          years_experience: 6,
          avatar_url: null,
          availability: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
          status: 'active'
        },
        {
          first_name: 'Sarah',
          last_name: 'Williams',
          email: 'sarah.williams@vikinghammer.com',
          phone: '+994501234570',
          specialties: ['Bodybuilding', 'Nutrition', 'Powerlifting'],
          certifications: ['NASM Certified Personal Trainer', 'Sports Nutritionist', 'Powerlifting Coach'],
          bio: 'Bodybuilding and powerlifting coach with expertise in muscle building, body recomposition, and nutrition planning. Helps clients achieve aesthetic and strength goals.',
          years_experience: 7,
          avatar_url: null,
          availability: ['Wednesday', 'Friday', 'Saturday', 'Sunday'],
          status: 'active'
        },
        {
          first_name: 'David',
          last_name: 'Brown',
          email: 'david.brown@vikinghammer.com',
          phone: '+994501234571',
          specialties: ['Endurance Training', 'Running', 'Triathlon'],
          certifications: ['Certified Running Coach', 'Ironman Finisher', 'Sports Performance Coach'],
          bio: 'Endurance athlete and coach specializing in marathon training, triathlon prep, and long-distance running. Former competitive runner with multiple marathon completions.',
          years_experience: 10,
          avatar_url: null,
          availability: ['Monday', 'Wednesday', 'Saturday', 'Sunday'],
          status: 'active'
        }
      ];

      const { data: insertedInstructors, error: insertError } = await supabase
        .from('instructors')
        .insert(testInstructors)
        .select();

      if (insertError) {
        console.error('❌ Error creating test instructors:', insertError);
        return;
      }

      console.log(`✅ Successfully created ${insertedInstructors.length} test instructors!\n`);
      console.log('📋 Created Instructors:');
      insertedInstructors.forEach((instructor, index) => {
        console.log(`   ${index + 1}. ${instructor.first_name} ${instructor.last_name} (${instructor.specialties.join(', ')})`);
      });
    }

    console.log('\n✅ Instructor Management System Ready for Testing!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testInstructors();
