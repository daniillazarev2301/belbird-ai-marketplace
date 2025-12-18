import { ArrowRight, Phone, FileText, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              Готовы начать сотрудничество?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-lg">
              Оставьте заявку и получите персональное предложение с учётом объёмов вашего хозяйства. 
              Специальные условия для оптовых покупателей.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" className="gap-2 h-12" asChild>
                <Link to="/wholesale">
                  <FileText className="h-4 w-4" />
                  Оставить заявку
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-12 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <a href="tel:+79001234567">
                  <Phone className="h-4 w-4" />
                  +7 (900) 123-45-67
                </a>
              </Button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/wholesale" className="group bg-primary-foreground/10 backdrop-blur rounded-2xl p-6 hover:bg-primary-foreground/20 transition-colors">
              <FileText className="h-8 w-8 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Оптовикам</h3>
              <p className="text-primary-foreground/70 text-sm mb-4">
                Специальные цены от 100 голов. Договор, все документы.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>Подробнее</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link to="/contacts" className="group bg-primary-foreground/10 backdrop-blur rounded-2xl p-6 hover:bg-primary-foreground/20 transition-colors">
              <MessageCircle className="h-8 w-8 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Консультация</h3>
              <p className="text-primary-foreground/70 text-sm mb-4">
                Поможем подобрать породу и рассчитать кормовую базу.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>Связаться</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
