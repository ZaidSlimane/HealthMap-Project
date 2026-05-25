<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // DCI - Dénominations Communes Internationales
        Schema::create('dci', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('denomination');
            $table->enum('classification', ['nationale', 'orse', 'strategique'])->default('nationale');
            $table->string('classe_therapeutique')->nullable();
            $table->timestamps();
        });

        // Fournisseurs
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->enum('type', ['fournisseur', 'laboratoire'])->default('fournisseur');
            $table->string('contact')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->timestamps();
        });

        // Produits (Nomenclature Commerciale)
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->string('code_nomenclature', 30)->unique();
            $table->string('nom_commercial');
            $table->foreignId('dci_id')->nullable()->constrained('dci')->nullOnDelete();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->string('forme')->nullable(); // comprimé, sirop, injectable, etc.
            $table->string('dosage')->nullable();
            $table->string('unite')->default('unité'); // unité, boîte, flacon, etc.
            $table->integer('stock_actuel')->default(0);
            $table->integer('seuil_min')->default(10);
            $table->integer('seuil_securite')->default(20);
            $table->decimal('prix_unitaire', 10, 2)->nullable();
            $table->boolean('is_psychotrope')->default(false);
            $table->boolean('is_stupefiant')->default(false);
            $table->timestamps();
        });

        // Commandes
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 30)->unique();
            $table->foreignId('fournisseur_id')->constrained('fournisseurs')->cascadeOnDelete();
            $table->date('date_commande');
            $table->enum('statut', ['en_attente', 'confirmee', 'recue'])->default('en_attente');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Lignes de commande
        Schema::create('ligne_commande', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained('commandes')->cascadeOnDelete();
            $table->foreignId('produit_id')->constrained('produits')->cascadeOnDelete();
            $table->integer('qte_commandee');
            $table->integer('qte_recue')->default(0);
            $table->string('lot')->nullable();
            $table->date('date_expiration')->nullable();
            $table->decimal('prix_unitaire', 10, 2)->nullable();
            $table->timestamps();
        });

        // Mouvements de stock
        Schema::create('mouvements_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produit_id')->constrained('produits')->cascadeOnDelete();
            $table->enum('type', ['entree', 'sortie', 'ajustement']);
            $table->integer('quantite');
            $table->integer('stock_avant');
            $table->integer('stock_apres');
            $table->string('reference')->nullable(); // numéro de bon, commande, etc.
            $table->string('source_destination')->nullable(); // service, fournisseur
            $table->foreignId('commande_id')->nullable()->constrained('commandes')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('motif')->nullable();
            $table->timestamps();
        });

        // Dotations par service
        Schema::create('dotation_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('produit_id')->constrained('produits')->cascadeOnDelete();
            $table->enum('type', ['usuelle', 'psychotrope', 'stupefiant'])->default('usuelle');
            $table->integer('qte_allouee')->default(0);
            $table->integer('qte_utilisee')->default(0);
            $table->date('date_dotation');
            $table->timestamps();
            
            $table->unique(['service_id', 'produit_id', 'date_dotation']);
        });

        // Indexes for performance
        Schema::table('mouvements_stock', function (Blueprint $table) {
            $table->index(['produit_id', 'created_at']);
        });
        
        Schema::table('produits', function (Blueprint $table) {
            $table->index('stock_actuel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dotation_service');
        Schema::dropIfExists('mouvements_stock');
        Schema::dropIfExists('ligne_commande');
        Schema::dropIfExists('commandes');
        Schema::dropIfExists('produits');
        Schema::dropIfExists('fournisseurs');
        Schema::dropIfExists('dci');
    }
};
