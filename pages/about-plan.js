import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPlan() {
  const [selectedRegion, setSelectedRegion] = useState('wristExtensors');

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar Navigation */}
      <div className="w-48 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center overflow-hidden mr-2">
              <span className="text-white text-xs font-bold">1HP</span>
            </div>
            <span className="font-bold text-sm">1HP Troubleshooter</span>
          </Link>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li><Link href="/" className="block py-1 hover:text-red-500">Home</Link></li>
            <li><Link href="/about-plan" className="block py-1 font-bold text-red-500">About Plan</Link></li>
            <li><Link href="/exercise-program" className="block py-1 hover:text-red-500">Exercise Program</Link></li>
            <li><Link href="/progress-statistics" className="block py-1 hover:text-red-500">Progress Statistics</Link></li>
            <li><Link href="/load-tracking" className="block py-1 hover:text-red-500">Load Tracking</Link></li>
            <li><Link href="/switch-plan" className="block py-1 hover:text-red-500">Switch Plan</Link></li>
            <li><Link href="/account" className="block py-1 hover:text-red-500">Account</Link></li>
            <li><Link href="/go-pro" className="block py-1 hover:text-red-500">Go Pro</Link></li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">About Plan</h1>
          <div className="flex space-x-4">
            <Link href="/talk-to-expert" className="text-sm hover:text-red-500">Talk to an Expert</Link>
            <Link href="/addons" className="text-sm hover:text-red-500">Addons</Link>
            <Link href="/exercise-program" className="bg-red-500 text-white px-6 py-2 rounded-full text-sm hover:bg-red-600">
              Today's Exercises
            </Link>
          </div>
        </header>

        {/* Pain Region Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Pain Region</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            <div 
              className={`relative border-2 ${selectedRegion === 'wristExtensors' ? 'border-red-500' : 'border-dashed border-gray-400'} p-1 w-24 h-32 cursor-pointer`}
              onClick={() => setSelectedRegion('wristExtensors')}
            >
              <div className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Wrist Image</span>
                </div>
              </div>
              <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-white bg-opacity-80 p-1">
                Wrist / Hand Extensors
              </span>
            </div>
            
            {/* Other pain regions (dashed outline placeholders) */}
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="border-2 border-dashed border-gray-400 w-24 h-32"
              />
            ))}
          </div>
        </div>

        {/* What Structures Are Involved */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">What Structures Are Involved</h2>
          <div className="bg-red-300 rounded-lg overflow-hidden flex">
            <div className="p-8 flex-1">
              <h3 className="text-xl font-bold text-center">Extensor Digitorum</h3>
              <h4 className="text-lg text-center mb-6">Tendon & Muscle</h4>
              <p className="text-center text-lg font-medium">
                Actions: Wrist / Finger<br />Extension
              </p>
            </div>
            <div className="w-1/3 bg-white p-4 flex flex-col items-center justify-center">
              <div className="relative w-32 h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-500">Anatomy Image</span>
              </div>
              <div className="mt-4 bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Overview */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Problem Overview</h2>
          <p className="text-sm leading-relaxed">
            Pain is a useful indicator of something you need to work on. These muscles and tendons are involved in gripping the mouse and lifting the fingers up as you click buttons or keys. The muscle is responsible for lifting the wrist and fingers up towards the ceiling (if your palm is facing down)<br /><br />
            Stretching is a great start but ultimately it's only a short term relief of pain. In order to handle the excessive/repetitive stress of competitive gaming we have to build up the endurance of these muscles & tendons.<br /><br />
            Here are some areas to work on to make these muscles and tendons more ready to take on the strain of gaming. This is your plan on how to address your physical limitations.
          </p>
        </div>

        {/* Impairements */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Impairements</h2>
          <div className="flex flex-wrap gap-4">
            <div className="bg-red-500 text-white px-8 py-3 rounded-full text-center">
              Muscle Length
            </div>
            <div className="bg-red-500 text-white px-8 py-3 rounded-full text-center">
              Endurance
            </div>
            <div className="bg-yellow-100 text-black px-8 py-3 rounded-full text-center">
              Neural Tension
            </div>
          </div>
        </div>

        {/* The Key Approach */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">The Key Approach</h2>
          <p className="text-sm leading-relaxed">
            The way we will be approaching this discomfort will be to build up strength & endurance in the hand and wrist directly. This will take time as it takes roughly 4-6 weeks of consistent work to make a change in tissue strength. In about 2 weeks I am expecting around a 60-70% improvement and around more than 90% at the 6-week mark if you are consistent with the overall routine. The shoulder exercises also help to give you a more stable base for your wrist to work from.
          </p>
        </div>

        {/* Exercise Program Guidelines */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Exercise Program Guidelines & Things to Remember</h2>
          <div className="text-sm leading-relaxed">
            <p className="mb-2"><strong>When?</strong> AM / PM. First thing in the morning, and before bed</p>
            <p className="mb-2"><strong>What?</strong> Perform all of the exercises together in one session</p>
            <p className="mb-2"><strong>How?</strong> Perform all of the exercises together in one session and stretches can be performed throughout the day. All Strengthening / endurance Exercises with Metronome set to 50 BPM.</p>
            <p className="mb-4">
              Keep track of reps to fatigue and reps to pain. With each exercise and document the number 2x a week so we can keep track of your progress or modify. No exercise should ever cause more than 5/10 Pain If you experience sharp 5/10 pain, evaluate how you are performing the exercise. If you are doing the exercises with correct form, but still having significant pain. End the exercise and talk to a medical professional.
            </p>
            <p>See sample schedule below. Recovery days can include the exercises and stretches in any of the 1HP routines on the website or youtube.</p>
          </div>

          {/* Weekly Schedule */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 bg-pink-100">Mon</th>
                  <th className="border border-gray-300 px-4 py-2 bg-pink-100">Tues</th>
                  <th className="border border-gray-300 px-4 py-2 bg-pink-100">Wed</th>
                  <th className="border border-gray-300 px-4 py-2 bg-pink-100">Thurs</th>
                  <th className="border border-gray-300 px-4 py-2 bg-pink-100">Fri</th>
                  <th className="border border-gray-300 px-4 py-2 bg-pink-100">Sat</th>
                  <th className="border border-gray-300 px-4 py-2 bg-pink-100">Sun</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise</td>
                  <td className="border border-gray-300 px-4 py-2 bg-red-200 text-center">Rest/Stretch</td>
                  <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise</td>
                  <td className="border border-gray-300 px-4 py-2 bg-red-200 text-center">Rest/Stretch</td>
                  <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise</td>
                  <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise</td>
                  <td className="border border-gray-300 px-4 py-2 bg-red-200 text-center">Recovery</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Exercises Button */}
        <div className="flex justify-center my-10">
          <Link href="/exercise-program" className="bg-red-500 text-white px-16 py-4 rounded-full text-xl font-medium hover:bg-red-600">
            Today's Exercises
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-4 border-t border-gray-200 text-sm text-gray-500">
          <div className="flex space-x-4">
            <Link href="/terms" className="text-blue-500 hover:underline">Terms and Conditions</Link>
            <Link href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>
          </div>
          <p className="mt-2">1Healthpoint Inc. 2025</p>
        </footer>
      </div>
    </div>
  );
}