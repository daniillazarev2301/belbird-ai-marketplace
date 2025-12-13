import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const formatDataForExport = {
  products: (products: any[]) => {
    return products.map(p => ({
      'ID': p.id,
      'Название': p.name,
      'SKU': p.sku || '',
      'Категория': p.categories?.name || '',
      'Цена': p.price,
      'Старая цена': p.old_price || '',
      'Остаток': p.stock_count || 0,
      'Рейтинг': p.rating || 0,
      'Активен': p.is_active ? 'Да' : 'Нет',
      'Хит продаж': p.is_bestseller ? 'Да' : 'Нет',
      'Новинка': p.is_new ? 'Да' : 'Нет',
    }));
  },

  orders: (orders: any[]) => {
    return orders.map(o => ({
      'ID заказа': o.id,
      'Дата': new Date(o.created_at).toLocaleString('ru-RU'),
      'Клиент': o.profiles?.full_name || o.shipping_address?.name || '',
      'Email': o.profiles?.email || o.shipping_address?.email || '',
      'Телефон': o.profiles?.phone || o.shipping_address?.phone || '',
      'Статус': o.status,
      'Статус оплаты': o.payment_status || '',
      'Способ оплаты': o.payment_method || '',
      'Сумма': o.total_amount,
      'Адрес': o.shipping_address?.address || '',
      'Город': o.shipping_address?.city || '',
    }));
  },

  customers: (customers: any[]) => {
    return customers.map(c => ({
      'ID': c.id,
      'Имя': c.full_name || '',
      'Email': c.email || '',
      'Телефон': c.phone || '',
      'Количество заказов': c.orders_count || 0,
      'Сумма покупок': c.total_spent || 0,
      'Баллы лояльности': c.loyalty_points || 0,
      'Теги': c.customer_tags?.join(', ') || '',
      'Заметки': c.customer_notes || '',
      'Регистрация': c.created_at ? new Date(c.created_at).toLocaleDateString('ru-RU') : '',
    }));
  },

  categories: (categories: any[], flatList: any[] = []) => {
    const flatten = (cats: any[], level = 0): any[] => {
      return cats.flatMap(c => [
        {
          'ID': c.id,
          'Название': c.name,
          'Slug': c.slug,
          'Родительская': c.parent_id || '',
          'Описание': c.description || '',
          'URL изображения': c.image_url || '',
          'Количество товаров': c.productCount || 0,
          'Уровень': level,
        },
        ...flatten(c.children || [], level + 1)
      ]);
    };
    return flatten(categories);
  },

  promoCodes: (codes: any[]) => {
    return codes.map(c => ({
      'ID': c.id,
      'Код': c.code,
      'Скидка %': c.discount_percent || '',
      'Скидка сумма': c.discount_amount || '',
      'Мин. сумма заказа': c.min_order_amount || 0,
      'Использовано': c.used_count || 0,
      'Макс. использований': c.max_uses || 'Безлимит',
      'Действует с': c.valid_from ? new Date(c.valid_from).toLocaleDateString('ru-RU') : '',
      'Действует до': c.valid_until ? new Date(c.valid_until).toLocaleDateString('ru-RU') : '',
      'Активен': c.is_active ? 'Да' : 'Нет',
    }));
  },
};
