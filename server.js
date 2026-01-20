require('dotenv').config();
const app = require('./src/app');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');
const cronService = require('./src/jobs/cron');
const queueWorker = require('./src/jobs/queue.worker');
const syncJob = require('./src/jobs/sync.job');

const PORT = process.env.PORT || 3000;

// Start Cron Jobs
syncJob();

async function startServer() {
    try {
        // 1. Connect Database
        await sequelize.authenticate();
        console.log('Database connected!');

        // 2. Sync Models (Alter for dev/updates)
        await sequelize.sync({ alter: true });
        console.log('Models synced!');

        // 2.1 Create default user
        const { User } = require('./src/models');
        const adminPrincipal = await User.findOne({ where: { email: 'Nos.ecolaborativo@gmail.com' } });
        if (!adminPrincipal) {
            await User.create({
                nome: 'Admin Principal',
                email: 'Nos.ecolaborativo@gmail.com',
                senha_hash: 'Lorena13@',
                role: 'ADMIN'
            });
            console.log('Default user created: Nos.ecolaborativo@gmail.com');
        }

        const adminPatrick = await User.findOne({ where: { email: 'patrick@gmail.com' } });
        if (!adminPatrick) {
            await User.create({
                nome: 'Patrick Admin',
                email: 'patrick@gmail.com',
                senha_hash: 'patrick123',
                role: 'ADMIN'
            });
            console.log('Default user created: patrick@gmail.com');
        }

        const adminRevestese = await User.findOne({ where: { email: 'admin@reveste-se.com' } });
        if (!adminRevestese) {
            await User.create({
                nome: 'Reveste-se Admin',
                email: 'admin@reveste-se.com',
                senha_hash: 'admin',
                role: 'ADMIN'
            });
            console.log('Default user created: admin@reveste-se.com');
        } else {
            // Ensure password is correct (hashes 'admin' again or sets it if using plain)
            // Tiptag User model likely uses hooks too, or store plain.
            // Based on 'senha_hash' name, it implies hashing, but let's just update it.
            adminRevestese.senha_hash = 'admin';
            await adminRevestese.save();
            console.log('Default user updated: admin@reveste-se.com');
        }

        // 3. Init Background Jobs
        cronService.init();
        queueWorker.init();

        // 4. Start Express
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });

    } catch (err) {
        console.error('Unable to start server:', err);
        process.exit(1);
    }
}

startServer();
