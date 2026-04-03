const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/it-mis')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const authUsers = await mongoose.connection.db.collection('authusers').find().toArray();
    console.log('Found', authUsers.length, 'users in authusers collection');
    
    for (const user of authUsers) {
      await mongoose.connection.db.collection('users').updateOne(
        { email: user.email },
        { $set: { 
          rollNo: user.rollNo || 'U' + Date.now(),
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          dateOfJoining: user.dateOfJoining || new Date()
        }},
        { upsert: true }
      );
      console.log('Migrated:', user.email);
    }
    
    console.log('Migration complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
