import re

with open("client/app/(dashboard)/admin/products/page.tsx", "r") as f:
    content = f.read()

# Replace header block
content = content.replace(
    '''<div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Products</h1>
                    <p className="text-gray-500">Add, edit, or deactivate product campaigns.</p>
                </div>
                <Button onClick={() => {
                    if (showForm) resetForm();
                    else setShowForm(true);
                }} className="text-white">{showForm ? "Cancel" : "Add New Product"}</Button>
            </div>''',
    '''<div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-4xl font-heading text-[#d4af37] tracking-wider uppercase">Manage Campaigns</h1>
                    <p className="text-white/40 mt-2 font-sans tracking-wide text-sm">Deploy and orchestrate product intelligence operations.</p>
                </div>
                <Button onClick={() => {
                    if (showForm) resetForm();
                    else setShowForm(true);
                }} className="bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37]/20 font-sans tracking-widest uppercase text-xs h-12 px-6 rounded-sm transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    {showForm ? "Abort Operation" : "Deploy New Campaign"}
                </Button>
            </div>'''
)

content = content.replace(
    '''<div className="space-y-6">''',
    '''<div className="space-y-10 relative z-10">''', 1
)

content = content.replace(
    '''<Card>
                    <CardHeader><CardTitle>{editingId ? "Edit Product" : "New Product"}</CardTitle></CardHeader>''',
    '''<Card className="glass-panel border-[#d4af37]/30 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
                    <CardHeader className="border-b border-white/5 pb-4 mb-4">
                        <CardTitle className="text-xl font-heading text-white tracking-widest uppercase">{editingId ? "Modify Operation Parameter" : "Initialize Operation Dossier"}</CardTitle>
                    </CardHeader>'''
)

# Replace common inputs and selects
content = re.sub(r'className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"', 'className="h-12 w-full rounded-sm border border-white/10 bg-black/40 px-3 text-white text-sm font-sans outline-none focus:border-[#d4af37]/50"', content)

content = re.sub(r'<Label>([\s\S]*?)</Label>', r'<Label className="text-white/60 uppercase tracking-widest text-[10px]">\1</Label>', content)
content = re.sub(r'<Label htmlFor="([^"]+)">([\s\S]*?)</Label>', r'<Label htmlFor="\1" className="text-white/60 uppercase tracking-widest text-[10px]">\2</Label>', content)

# General Inputs
content = re.sub(r'<Input (.*?) />', r'<Input \1 className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 font-sans" />', content)

# Checkboxes
content = content.replace('bg-gray-50 border', 'bg-white/5 border-white/10 text-white')
content = content.replace('hover:bg-gray-100', 'hover:bg-white/10 hover:border-[#d4af37]/50')
content = content.replace('text-gray-500', 'text-white/50')
content = content.replace('text-blue-500', 'text-[#d4af37]')

# Buttons
content = content.replace('bg-blue-600', 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/50')
content = content.replace('hover:bg-blue-700', 'hover:bg-[#d4af37]/20')

# Table / Card rendering
content = content.replace('p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4', 'p-6 glass-panel border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[0_0_20px_rgba(212,175,55,0.02)]')

with open("client/app/(dashboard)/admin/products/page.tsx", "w") as f:
    f.write(content)
