"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Star, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const Prism = dynamic(() => import("@/components/Prism"), { ssr: false });

const CATEGORIES = [
  "All",
  "Products",
  "Places",
  "Apps",
  "Books",
  "Movies",
  "Restaurants",
  "Games",
];

interface Item {
  id: number;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  averageRating: number;
  totalReviews: number;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, selectedCategory, items]);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items?limit=50");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
        setFilteredItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Prism Background */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Prism WebGL Background */}
        <div className="absolute inset-0 opacity-30">
          <Prism
            animationType="rotate"
            timeScale={0.3}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0.5}
            colorFrequency={1.2}
            noise={0.3}
            glow={1.5}
            bloom={1.2}
          />
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--color-neon-pink)_0%,_transparent_50%)] opacity-20" />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-[oklch(0.75_0.25_350)] to-[oklch(0.75_0.18_200)] bg-clip-text text-transparent">
              Your Words Make the Difference
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Share your experiences and help others make informed decisions. Every review counts.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg bg-card border-border/50 focus:border-primary transition-all"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "bg-primary hover:bg-primary/90"
                    : "border-border/50 hover:border-primary/50"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">
                {selectedCategory === "All" ? "Trending Reviews" : selectedCategory}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No items found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`}>
                  <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 h-full">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Image
                        src={
                          item.name.toLowerCase().includes("iphone 15")
                            ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_zJnvLwcXGHYA6yui-qBOft8dtGWlD8MYvQ&s"
                            : item.name.toLowerCase().includes("tokyo disney")
                            ? "https://girleatworld.net/wp-content/uploads/2019/05/tokyo-disneyland-08.jpg"
                            : item.name.toLowerCase().includes("central park")
                            ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYFg1fhUSFsOpcW70iE11uXzQuTpfj5tv3fA&s"
                            : item.name.toLowerCase().includes("chatgpt")
                            ? "https://thumbs.dreamstime.com/b/chatgpt-artificial-intelligence-program-logo-openai-company-polygonal-green-background-illustration-banner-news-vector-286505082.jpg"
                            : item.name.toLowerCase().includes("notion")
                            ? "https://preview.redd.it/what-are-your-thoughts-on-notion-ai-has-it-truly-simplified-v0-2telgdckvbmc1.jpg?width=400&format=pjpg&auto=webp&s=ca8fca67ac9c39e086571875be24b2988cf3af5a"
                            : item.name.toLowerCase().includes("harry potter")
                            ? "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1598823299i/42844155.jpg"
                            : item.imageUrl ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80"
                        }
                        alt={item.name}
                        fill
                        unoptimized
                        onError={(e) => {
                          // Graceful fallback in case remote image fails
                          const img = e.currentTarget as HTMLImageElement;
                          img.src = "/images/iphone-15-pro.svg";
                        }}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border-border/50">
                        {item.category}
                      </Badge>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        {renderStars(item.averageRating)}
                        <span className="text-sm text-muted-foreground">
                          {item.totalReviews} {item.totalReviews === 1 ? "review" : "reviews"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-primary">
                          {item.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">out of 5</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 mt-20">
        <div className="container mx-auto max-w-7xl text-center text-muted-foreground">
          <p>&copy; 2024 ReviewHub. Your words make the difference.</p>
        </div>
      </footer>
    </div>
  );
}