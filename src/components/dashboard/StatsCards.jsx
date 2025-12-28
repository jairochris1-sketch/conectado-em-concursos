import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsCards({ title, value, icon: Icon, gradient, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-r ${gradient} rounded-full opacity-10`} />
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {value}
              </div>
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20 shadow-lg`}>
              <Icon className={`w-5 h-5 md:w-6 md:h-6 text-white`} />
            </div>
          </div>
          {trend && (
            <div className="flex items-center mt-2 text-xs md:text-sm">
              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
              <span className="text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}