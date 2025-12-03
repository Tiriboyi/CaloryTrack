import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Utensils, X, Plus, Trash2, Calculator } from 'lucide-react';
import { foodDatabase } from '../foodData';

export function CalorieChecker({ isOpen, onClose, onApply }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFoods, setSelectedFoods] = useState([]);
    const [caloriesBurnt, setCaloriesBurnt] = useState('');
    const [mobileTab, setMobileTab] = useState('search');

    const filteredFoods = foodDatabase.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddFood = (food) => {
        setSelectedFoods(prev => [...prev, { ...food, id: Date.now() }]);
    };

    const handleRemoveFood = (id) => {
        setSelectedFoods(prev => prev.filter(item => item.id !== id));
    };

    const totalFoodCalories = selectedFoods.reduce((sum, item) => sum + item.calories, 0);
    const burntValue = parseInt(caloriesBurnt) || 0;
    const netCalories = burntValue - totalFoodCalories;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="glass-panel w-full max-w-4xl h-[85vh] md:h-[650px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Tabs */}
                        <div className="md:hidden flex border-b border-white/5">
                            <button
                                onClick={() => setMobileTab('search')}
                                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${mobileTab === 'search' ? 'text-white' : 'text-text-secondary'}`}
                            >
                                Find Food
                                {mobileTab === 'search' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                                )}
                            </button>
                            <button
                                onClick={() => setMobileTab('calculator')}
                                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${mobileTab === 'calculator' ? 'text-white' : 'text-text-secondary'}`}
                            >
                                Calculator ({selectedFoods.length})
                                {mobileTab === 'calculator' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                                )}
                            </button>
                            <button onClick={onClose} className="px-4 border-l border-white/5 text-text-secondary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Left Side: Search */}
                        <div className={`flex-1 flex flex-col border-r border-white/5 ${mobileTab === 'search' ? 'flex' : 'hidden md:flex'}`}>
                            <div className="hidden md:flex p-6 border-b border-white/5 justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Search className="w-5 h-5 text-accent-secondary" />
                                    Find Food
                                </h2>
                            </div>

                            <div className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
                                <div className="mb-4 relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 md:h-5 md:w-5 text-text-tertiary" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search foods..."
                                        className="w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 rounded-xl bg-bg-secondary/50 border border-border-color text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm md:text-base"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-2">
                                    {filteredFoods.length > 0 ? (
                                        filteredFoods.map((food, index) => (
                                            <motion.div
                                                key={food.name}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary/30 border border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                                                onClick={() => {
                                                    handleAddFood(food);
                                                    // Optional: Switch to calculator tab on add? 
                                                    // setMobileTab('calculator'); 
                                                }}
                                            >
                                                <div>
                                                    <h3 className="font-medium text-white text-sm md:text-base">{food.name}</h3>
                                                    <p className="text-[10px] md:text-xs text-text-tertiary">{food.unit}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="font-bold text-accent-primary text-sm md:text-base">{food.calories}</div>
                                                        <div className="text-[10px] md:text-xs text-text-tertiary">kcal</div>
                                                    </div>
                                                    <Plus className="w-4 h-4 md:w-5 md:h-5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-text-tertiary text-sm">
                                            <p>No foods found matching "{searchTerm}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Calculator */}
                        <div className={`flex-1 flex flex-col bg-bg-secondary/30 ${mobileTab === 'calculator' ? 'flex' : 'hidden md:flex'}`}>
                            <div className="hidden md:flex p-6 border-b border-white/5 justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-accent-primary" />
                                    Net Calculator
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-text-secondary" />
                                </button>
                            </div>

                            <div className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
                                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-2 mb-4">
                                    <AnimatePresence mode='popLayout'>
                                        {selectedFoods.length > 0 ? (
                                            selectedFoods.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-white/5"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-accent-secondary/10 flex items-center justify-center">
                                                            <Utensils className="w-4 h-4 text-accent-secondary" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-white text-sm">{item.name}</h3>
                                                            <p className="text-[10px] text-text-tertiary">{item.unit}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-white text-sm md:text-base">{item.calories}</span>
                                                        <button
                                                            onClick={() => handleRemoveFood(item.id)}
                                                            className="p-1.5 hover:bg-danger/20 hover:text-danger rounded-lg text-text-tertiary transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-text-tertiary opacity-50">
                                                <Utensils className="w-10 h-10 md:w-12 md:h-12 mb-2" />
                                                <p className="text-sm">Add foods to calculate intake</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-auto pt-4 md:pt-6 border-t border-white/10 space-y-3 md:space-y-4">
                                    {/* Calories Burnt Input */}
                                    <div className="bg-bg-tertiary/50 p-3 md:p-4 rounded-xl border border-white/5">
                                        <label className="text-[10px] md:text-xs text-text-secondary font-medium mb-1 md:mb-2 block uppercase tracking-wider">Calories Burnt</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 500"
                                            className="w-full bg-transparent text-lg md:text-xl font-bold text-white placeholder-white/20 focus:outline-none"
                                            value={caloriesBurnt}
                                            onChange={(e) => setCaloriesBurnt(e.target.value)}
                                        />
                                    </div>

                                    {/* Summary */}
                                    <div className="space-y-1 md:space-y-2">
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="text-text-secondary">Calories Burnt</span>
                                            <span className="text-white font-medium">{burntValue}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="text-text-secondary">Food Intake</span>
                                            <span className="text-accent-primary font-medium">-{totalFoodCalories}</span>
                                        </div>
                                        <div className="flex justify-between items-end pt-2 border-t border-white/10">
                                            <span className="text-text-secondary font-medium text-sm md:text-base">Net Total</span>
                                            <span className={`text-3xl md:text-4xl font-black text-transparent bg-clip-text ${netCalories >= 0 ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-accent-secondary to-yellow-400'}`}>
                                                {netCalories}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { setSelectedFoods([]); setCaloriesBurnt(''); }}
                                            className="py-3 rounded-xl border border-white/10 text-text-secondary hover:bg-white/5 transition-colors text-sm font-medium"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => onApply(netCalories)}
                                            className="py-3 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors text-sm font-bold shadow-lg shadow-accent-primary/25"
                                        >
                                            Use Net Total
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
