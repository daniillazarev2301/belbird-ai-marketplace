/**
 * Badge showing current data architecture status
 */

import { Cloud, Server, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useHybridConfig, getDataSourceLabel } from '@/hooks/useHybridData';

export function HybridStatusBadge() {
  const config = useHybridConfig();

  const getIcon = () => {
    switch (config.source) {
      case 'lovable-cloud':
        return <Cloud className="h-3 w-3" />;
      case 'self-hosted':
        return <Server className="h-3 w-3" />;
      case 'hybrid':
        return <GitBranch className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (config.source) {
      case 'lovable-cloud':
        return 'secondary';
      case 'self-hosted':
        return 'default';
      case 'hybrid':
        return 'outline';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getVariant()} className="gap-1 cursor-help">
            {getIcon()}
            {getDataSourceLabel(config.source)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-medium">Архитектура данных:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <Cloud className="h-3 w-3 text-blue-500" />
                <span>Каталог, контент → Lovable Cloud</span>
              </li>
              {config.source === 'hybrid' && (
                <li className="flex items-center gap-2">
                  <Server className="h-3 w-3 text-green-500" />
                  <span>Заказы, клиенты → {config.externalApiUrl}</span>
                </li>
              )}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
