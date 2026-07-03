import React from 'react';
import Image from 'next/image';

type ShowcaseItem = {
  type: 'image' | 'iframe';
  src: string;
  title: string;
  description: string;
  tag: string;
};

const showcaseItems: ShowcaseItem[] = [
  {
    type: 'image',
    src: '/showcase/app1.png',
    title: 'Task Manager SaaS',
    description: 'Built in 4 minutes. Full auth, Kanban board, and team assignments.',
    tag: 'Productivity',
  },
  {
    type: 'image',
    src: '/showcase/app2.png',
    title: 'Invoice Generator',
    description: 'PDF export, client management, and recurring billing.',
    tag: 'Finance',
  },
  {
    type: 'image',
    src: '/showcase/app3.png',
    title: 'CRM Dashboard',
    description: 'Contact tracking, pipeline view, and analytics.',
    tag: 'Sales',
  },
];

const AppShowcase: React.FC = () => {
  return (
    <section id="showcase" className="py-24 bg-background relative">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Built with Cognix
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real apps shipped by real founders
          </p>
        </div>

        {/* Grid of previews */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcaseItems.map((item, idx) => (
            <div key={idx} className="relative rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-2xl group">
              <div className="absolute -inset-1 bg-linear-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>

              <div className="relative bg-slate-950 rounded-xl overflow-hidden flex flex-col">
                {/* Mock browser chrome */}
                <div className="h-10 border-b border-slate-800 flex items-center px-4 gap-3 bg-slate-900/50 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  </div>
                  <div className="flex-1 bg-slate-800 rounded-md h-5 flex items-center px-3">
                    <span className="text-[10px] text-slate-500 font-mono truncate">cognix.live/demo</span>
                  </div>
                </div>

                {/* Image */}
                <div className="relative w-full h-48">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </div>

              {/* Card footer */}
              <div className="px-2 pt-3 pb-1 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-border shrink-0">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default AppShowcase;