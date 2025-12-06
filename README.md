# JobTinder 💼❤️

A Tinder-style job swiping application built with Next.js and Supabase. Swipe right on jobs you like, left on jobs you pass!

## Features

- 🔐 **Authentication** - Signup, Login, Logout with Supabase Auth
- 💼 **Job Swiping** - Tinder-style one-at-a-time job cards
- ❤️ **Like to Apply** - Like a job to create a draft application
- ❌ **Pass** - Skip jobs you're not interested in
- 📋 **Liked Jobs** - View all jobs you've applied to
- 👤 **Profile** - Edit your name, skills, and location
- 🔄 **Reset Passed Jobs** - See jobs you passed again
- 🔒 **Protected Routes** - Only logged-in users can access the app

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

- **profiles** - User profiles (name, skills, location)
- **jobs** - Job listings (title, company, description)
- **swipes** - User swipe actions (like/pass)
- **applications** - Draft applications for liked jobs

## Project Structure

```
src/
├── app/
│   ├── jobs/          # Main job swiping page
│   ├── liked/         # Liked/applied jobs
│   ├── login/         # Login page
│   ├── profile/       # User profile
│   └── signup/        # Signup page
├── components/
│   ├── JobCard.js     # Individual job card
│   ├── JobSwiper.js   # Swipe controller
│   └── LogoutButton.js
├── lib/
│   └── supabase/      # Supabase client helpers
└── middleware.js      # Route protection
```

## Future Features

- 🤖 AI CV Generation
- 📧 Email notifications
- 🔍 Job filtering by skills
- 📊 Application dashboard

## License

MIT
