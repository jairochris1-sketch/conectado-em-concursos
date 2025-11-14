import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCards({ title, value, icon: Icon, gradient, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-xl">
        <CardContent className="p-4 md:p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </div>
            </div>
            <div className={`p-2.5 md:p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          {trend && (
            <div className="mt-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {trend}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}