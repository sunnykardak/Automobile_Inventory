'use client';

import { useState } from 'react';
import {
  HelpCircle, Book, MessageCircle, Phone, Mail, ChevronDown,
  ChevronUp, Search, FileText, Video, Lightbulb, ExternalLink,
  CheckCircle, Clipboard, Package, Users, BarChart2, IndianRupee,
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Jobs',
    question: 'How do I create a new job card?',
    answer: 'Navigate to Tasks/Jobs from the sidebar, click on "Create Job Card" button. Fill in the customer details, vehicle information, and reported issues. Assign a mechanic and set the estimated cost. Click "Create Job" to save.',
  },
  {
    category: 'Jobs',
    question: 'How do I add products to a job?',
    answer: 'Open the job card by clicking on it. In the job details view, find the "Add Products" section. Select the product from inventory, enter the quantity, and click "Add to Job". The cost will be automatically calculated.',
  },
  {
    category: 'Jobs',
    question: 'How do I complete a job and generate a bill?',
    answer: 'Open the job card and click "Complete Job & Generate Bill". Review the bill summary including products, labor charges, and taxes. Select the payment method and click "Complete & Generate Bill". This will deduct inventory and add commission to the mechanic.',
  },
  {
    category: 'Inventory',
    question: 'How do I add new products to inventory?',
    answer: 'Go to Inventory from the sidebar. Click "Add Product". Select the manufacturer, category, and product from the master catalog. Enter the quantity, pricing, and storage location. Click "Save Product".',
  },
  {
    category: 'Inventory',
    question: 'How do I restock inventory items?',
    answer: 'In the Inventory page, find the item you want to restock. Click the "Restock" button. Enter the quantity to add, supplier information, and invoice number. Click "Confirm Restock".',
  },
  {
    category: 'Inventory',
    question: 'How do I view low stock alerts?',
    answer: 'Low stock alerts are shown on the Dashboard. You can also go to Inventory and filter by "Low Stock" to see all items below minimum stock level. Go to Reports to see a detailed low stock report.',
  },
  {
    category: 'Employees',
    question: 'How do I add a new employee?',
    answer: 'Go to Employees from the sidebar. Click "Add Employee". Fill in personal details, job information (designation, salary, commission percentage), and ID proof details. Set a password for their account.',
  },
  {
    category: 'Employees',
    question: 'How are commissions calculated?',
    answer: 'When a job is completed, the system automatically calculates commission based on the employee\'s commission percentage and the job\'s total value. Commissions are added to their pending balance.',
  },
  {
    category: 'Employees',
    question: 'How do I pay employee salary?',
    answer: 'In the Employees page, find the employee and click the "Pay Salary" button. Review their base salary and pending commissions. Enter the payment amount, select payment method, and confirm.',
  },
  {
    category: 'Reports',
    question: 'What reports are available?',
    answer: 'The system provides: Revenue reports (daily/monthly/yearly), Inventory usage reports, Employee performance reports, Vehicle service statistics, and Low stock alerts. All reports can be filtered by date range and exported to CSV.',
  },
  {
    category: 'Reports',
    question: 'How do I export reports?',
    answer: 'In the Reports page, select the date range and report type. Each report section has a download button. Click it to export the data as a CSV file that can be opened in Excel.',
  },
  {
    category: 'Billing',
    question: 'How do I view/print an invoice?',
    answer: 'When a job is completed, a bill is automatically generated. You can find it in the Bills section. Click on the bill to view details and use the print button to print or save as PDF.',
  },
];

const guides = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of the garage management system',
    icon: Book,
    steps: ['Login with your credentials', 'Explore the dashboard', 'Create your first job card', 'Add products to inventory'],
  },
  {
    title: 'Daily Workflow',
    description: 'Typical daily operations in the garage',
    icon: Clipboard,
    steps: ['Check pending jobs on dashboard', 'Create job cards for new vehicles', 'Update job status as work progresses', 'Complete jobs and generate bills'],
  },
  {
    title: 'Inventory Management',
    description: 'Keep your inventory organized and stocked',
    icon: Package,
    steps: ['Add products from master catalog', 'Set minimum stock levels', 'Monitor low stock alerts', 'Restock items when needed'],
  },
  {
    title: 'Team Management',
    description: 'Manage your employees and their performance',
    icon: Users,
    steps: ['Add employees with their details', 'Set commission percentages', 'Track job assignments', 'Process salary payments'],
  },
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(faqs.map(f => f.category))];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="text-brand-600" size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 font-display">Help & Support</h1>
        <p className="text-gray-600 mt-2">Find answers, guides, and contact support</p>
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search for help..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Start Guides */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb size={24} className="text-amber-500" />
          Quick Start Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide, idx) => {
            const Icon = guide.icon;
            return (
              <div key={idx} className="card p-5 hover:border-brand-200 transition-colors cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="text-brand-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{guide.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{guide.description}</p>
                    <ul className="mt-3 space-y-1">
                      {guide.steps.map((step, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle size={24} className="text-purple-500" />
          Frequently Asked Questions
        </h2>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All Topics' : cat}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="card divide-y divide-gray-100">
          {filteredFAQs.length === 0 ? (
            <div className="p-8 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">No matching questions found</p>
            </div>
          ) : (
            filteredFAQs.map((faq, idx) => (
              <div key={idx} className="p-4">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="badge badge-primary text-xs">{faq.category}</span>
                    <span className="font-medium text-gray-900">{faq.question}</span>
                  </div>
                  {expandedFAQ === idx ? (
                    <ChevronUp className="text-gray-400 flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                  )}
                </button>
                {expandedFAQ === idx && (
                  <div className="mt-3 pl-24 pr-8 text-gray-600 text-sm animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone size={24} className="text-emerald-500" />
          Contact Support
        </h2>
        <p className="text-gray-600 mb-6">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <Phone className="mx-auto text-brand-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">Phone Support</p>
            <p className="text-sm text-gray-500 mt-1">+91-1234567890</p>
            <p className="text-xs text-gray-400 mt-1">Mon-Sat, 9AM-6PM</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <Mail className="mx-auto text-purple-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">Email Support</p>
            <p className="text-sm text-gray-500 mt-1">support@autogarage.com</p>
            <p className="text-xs text-gray-400 mt-1">Response within 24 hours</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <MessageCircle className="mx-auto text-emerald-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">WhatsApp</p>
            <p className="text-sm text-gray-500 mt-1">+91-9876543210</p>
            <p className="text-xs text-gray-400 mt-1">Quick responses</p>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Automobile Inventory Management System v1.0.0</p>
        <p className="mt-1">© 2026 Auto Garage. All rights reserved.</p>
      </div>
    </div>
  );
}
